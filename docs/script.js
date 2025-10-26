const owner = 'explysm';
const repo = 'yikegames';
const branch = 'cdn';
const assetsPath = 'assets';
const githubApiBaseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
const githubRawContentBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

const assetBrowser = document.getElementById('asset-browser');
const loadingMessage = document.getElementById('loading-message');

async function fetchGitHubContents(path) {
    loadingMessage.style.display = 'flex';
    assetBrowser.innerHTML = ''; // Clear previous content

    try {
        const response = await fetch(`${githubApiBaseUrl}/${path}?ref=${branch}`);
        if (!response.ok) {
            // Log the full response status and text for better debugging
            const errorText = await response.text();
            console.error(`GitHub API error: ${response.status} - ${response.statusText}`, errorText);
            throw new Error(`GitHub API error: ${response.status} - ${response.statusText}. This might be due to CORS restrictions if opening directly from file system. Try running a local web server.`);
        }
        const contents = await response.json();

        // Sort contents: directories first, then files, both alphabetically
        contents.sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
        });

        renderContents(contents, path);
    } catch (error) {
        console.error('Error fetching GitHub contents:', error);
        assetBrowser.innerHTML = `<p class="error-message">Error loading assets: ${error.message}</p>`;
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function renderContents(contents, currentPath) {
    assetBrowser.innerHTML = ''; // Clear existing content

    // Add a "Go Up" button if not in the root assets directory
    if (currentPath !== assetsPath) {
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const upButton = document.createElement('div');
        upButton.className = 'nav-btn';
        upButton.textContent = '<- Go Up';
        upButton.addEventListener('click', () => fetchGitHubContents(parentPath === '' ? assetsPath : parentPath));
        assetBrowser.appendChild(upButton);
    }

    contents.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'post-item'; // Reusing existing style for cards

        if (item.type === 'dir') {
            itemElement.innerHTML = `
                <div class="post-content">
                    <h3 class="game-card-title">${item.name}/</h3>
                    <p class="game-card-description">Folder</p>
                    <button class="nav-btn" data-path="${item.path}">Open Folder</button>
                </div>
            `;
            itemElement.querySelector('button').addEventListener('click', () => fetchGitHubContents(item.path));
        } else {
            const downloadUrl = item.download_url || `${githubRawContentBaseUrl}/${item.path}`;
            let previewHtml = '';
            const fileExtension = item.name.split('.').pop().toLowerCase();

            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension)) {
                previewHtml = `<img src="${downloadUrl}" alt="${item.name}" class="post-image-preview">`;
            } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
                previewHtml = `<audio controls src="${downloadUrl}"></audio>`;
            }

            itemElement.innerHTML = `
                <div class="post-content">
                    <h3 class="game-card-title">${item.name}</h3>
                    <p class="game-card-description">File (${fileExtension.toUpperCase()})</p>
                    ${previewHtml}
                    <a href="${downloadUrl}" download="${item.name}" class="game-card-link">Download</a>
                </div>
            `;
        }
        assetBrowser.appendChild(itemElement);
    });
}

// Initial load
fetchGitHubContents(assetsPath);
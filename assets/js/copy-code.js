document.addEventListener('DOMContentLoaded', function() {
    // Add copy button to each code block
    document.querySelectorAll('pre').forEach(function(codeBlock) {
        // Only add button if it doesn't already exist
        if (!codeBlock.querySelector('.copy-button')) {
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.innerHTML = '<i class="fas fa-copy"></i>';

            // Add button to code block
            codeBlock.style.position = 'relative';
            codeBlock.appendChild(button);

            // Add click handler
            button.addEventListener('click', function() {
                // Get the code content
                const code = codeBlock.querySelector('code') || codeBlock;
                let text = code.innerText;

                // Clean up the text:
                // 1. Split into lines and remove empty lines
                let lines = text.split('\n').filter(line => line.trim() !== '');

                // 2. Join lines back together
                text = lines.join('\n');

                // 3. Remove any trailing newline
                text = text.replace(/\n$/, '');

                // Copy to clipboard
                navigator.clipboard.writeText(text).then(function() {
                    // Visual feedback
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(function() {
                        button.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy:', err);
                    button.innerHTML = '<i class="fas fa-times"></i>';
                });
            });
        }
    });
});

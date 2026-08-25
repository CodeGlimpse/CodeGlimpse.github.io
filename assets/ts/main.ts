import StackGallery from "ts/gallery";
import menu from "ts/menu";
import createElement from "ts/createElement";
import StackColorScheme from "ts/colorScheme";
import { setupScrollspy } from "ts/scrollspy";
import { setupSmoothAnchors } from "ts/smoothAnchors";

let Stack = {
    init: () => {
        menu();

        const articleContent = document.querySelector('.article-content') as HTMLElement;
        if (articleContent) {
            if (articleContent.querySelector('img')) {
                new StackGallery(articleContent);
            }
            setupSmoothAnchors();
            setupScrollspy();
        }

        const highlights = document.querySelectorAll('.article-content div.highlight');
        const copyText = `Copy`;
        const copiedText = `Copied!`;

        highlights.forEach(highlight => {
            const copyButton = document.createElement('button');
            copyButton.innerHTML = copyText;
            copyButton.classList.add('copyCodeButton');
            highlight.appendChild(copyButton);

            const codeBlock = highlight.querySelector('code[data-lang]');
            if (!codeBlock) return;

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(codeBlock.textContent)
                    .then(() => {
                        copyButton.textContent = copiedText;
                        setTimeout(() => {
                            copyButton.textContent = copyText;
                        }, 1000);
                    })
                    .catch(err => {
                        alert(err);
                        console.log('Something went wrong', err);
                    });
            });
        });

        new StackColorScheme(document.getElementById('dark-mode-toggle'));
    }
};

window.addEventListener('load', () => {
    setTimeout(() => Stack.init(), 0);
});

declare global {
    interface Window {
        createElement: any;
        Stack: any;
    }
}

window.Stack = Stack;
window.createElement = createElement;

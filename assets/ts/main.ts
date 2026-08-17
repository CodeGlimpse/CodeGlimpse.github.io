import StackGallery from "ts/gallery";
import { getColor } from "ts/color";
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

        const articleTile = document.querySelector('.article-list--tile');
        if (articleTile && typeof (window as any).Vibrant !== 'undefined') {
            const observer = new IntersectionObserver(async (entries, tileObserver) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    tileObserver.unobserve(entry.target);

                    const articles = entry.target.querySelectorAll('article.has-image');
                    articles.forEach(async article => {
                        const image = article.querySelector('img') as HTMLImageElement;
                        const articleDetails = article.querySelector('.article-details') as HTMLDivElement;
                        if (!image || !articleDetails) return;

                        const colors = await getColor(
                            image.getAttribute('data-key'),
                            image.getAttribute('data-hash'),
                            image.src
                        );

                        articleDetails.style.background = `
                        linear-gradient(0deg,
                            rgba(${colors.DarkMuted.rgb[0]}, ${colors.DarkMuted.rgb[1]}, ${colors.DarkMuted.rgb[2]}, 0.5) 0%,
                            rgba(${colors.Vibrant.rgb[0]}, ${colors.Vibrant.rgb[1]}, ${colors.Vibrant.rgb[2]}, 0.75) 100%)`;
                    });
                });
            });

            observer.observe(articleTile);
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

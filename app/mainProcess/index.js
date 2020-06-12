const navItems = document.querySelectorAll('.nav-item-flag');
const contents = document.querySelectorAll('.content-pages');

Array.prototype.forEach.call(navItems, (navItem) => {
    navItem.addEventListener('click', (event) => {
        if (navItem.dataset.section !== '.section-about') {
            for(i=0; i<contents.length; i++) {
                contents[i].classList.add('hide');
            }
        }
        let section = document.querySelector(navItem.dataset.section);
        section.classList.toggle('hide');
    });
});

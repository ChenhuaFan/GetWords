const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', (event) => {
    let view = document.querySelector('.section-about');
    view.classList.toggle('hide');
})
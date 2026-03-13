/* Hero Carousel */
(function () {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prev = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  let current = 0;
  let timer;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function autoPlay() {
    timer = setInterval(function () { goTo(current + 1); }, 7500);
  }

  function resetTimer() {
    clearInterval(timer);
    autoPlay();
  }

  if (prev) prev.addEventListener('click', function () { goTo(current - 1); resetTimer(); });
  if (next) next.addEventListener('click', function () { goTo(current + 1); resetTimer(); });
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () { goTo(Number(this.dataset.index)); resetTimer(); });
  });

  autoPlay();
})();

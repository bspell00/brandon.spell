(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Scroll-reveal -------------------------------------------------------
  // Fade + lift each .reveal element as it enters the viewport. Elements
  // already in view on load (e.g. the hero) animate immediately.
  var revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms'; // gentle ripple
      io.observe(el);
    });
  }

  // 2. Custom cursor follower ---------------------------------------------
  // A small dot that trails the pointer and swells into a "View" pill over
  // project cards. Pointer devices only — never shown on touch.
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var cursor = document.querySelector('.cursor');

  if (cursor && finePointer.matches) {
    document.body.classList.add('has-cursor');

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var posX = targetX;
    var posY = targetY;
    var ease = reduceMotion.matches ? 1 : 0.18; // 1 = snap, no trailing

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    (function render() {
      posX += (targetX - posX) * ease;
      posY += (targetY - posY) * ease;
      cursor.style.transform =
        'translate(' + posX + 'px,' + posY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(render);
    })();

    document.querySelectorAll('.project').forEach(function (project) {
      project.addEventListener('mouseenter', function () {
        cursor.classList.add('is-hovering');
      });
      project.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hovering');
      });
    });
  }
})();

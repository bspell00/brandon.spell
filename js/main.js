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

  // 2. Typewriter intro ----------------------------------------------------
  // Type the hero headline in on load. Each character is wrapped in a .char
  // span (recursing into .hl keyword spans so their hover effect survives),
  // then revealed one at a time with a travelling caret.
  var typeEl = document.querySelector('.typewriter');

  if (typeEl) {
    var chars = [];
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) { // text node -> one span per character
          var frag = document.createDocumentFragment();
          child.nodeValue.split('').forEach(function (ch) {
            var span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            frag.appendChild(span);
            chars.push(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { // element (.hl) -> recurse
          wrap(child);
        }
      });
    })(typeEl);

    typeEl.style.opacity = '1'; // reveal container; chars are still hidden

    if (reduceMotion.matches) {
      chars.forEach(function (c) { c.classList.add('is-shown'); });
      typeEl.classList.add('is-typed');
    } else {
      var caret = document.createElement('span');
      caret.className = 'tw-caret';
      caret.setAttribute('aria-hidden', 'true');
      typeEl.appendChild(caret);

      var i = 0;
      (function type() {
        if (i >= chars.length) { // leave caret blinking at the end
          typeEl.classList.add('is-typed'); // cue the subline (.hero-sub)
          return;
        }
        var c = chars[i];
        c.classList.add('is-shown');
        c.parentNode.insertBefore(caret, c.nextSibling); // caret follows
        i++;
        setTimeout(type, c.textContent === ' ' ? 24 : 42);
      })();
    }
  }

  // 3. Custom cursor follower ---------------------------------------------
  // A small dot that trails the pointer and swells into a "View" pill over
  // project cards. Pointer devices only — never shown on touch.
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var cursor = document.querySelector('.cursor');

  if (cursor && finePointer.matches) {
    document.body.classList.add('has-cursor');

    // The dot sits exactly on the pointer: it's moved straight from each
    // pointer event, with no easing or trail, so it never feels behind.
    // It stays hidden until the first move, so it's never parked at screen
    // center on page load.
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cursor.style.transform =
        'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)';
      cursor.classList.add('is-active');
    }, { passive: true });

    document.querySelectorAll('.project').forEach(function (project) {
      if (!project.querySelector('a')) return; // design pieces have no link to "View"
      project.addEventListener('mouseenter', function () {
        cursor.classList.add('is-hovering');
      });
      project.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hovering');
      });
    });
  }
})();

async function loadAboutContent() {
  const host = document.querySelector('.about-marketing-root');
  if (!host) return;

  try {
    const response = await fetch('marketing-content.html');
    if (!response.ok) throw new Error('Failed to load marketing content');

    const shadowRoot = host.attachShadow({ mode: 'open' });
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'landing.css';
    shadowRoot.appendChild(stylesheet);

    const content = document.createElement('main');
    content.innerHTML = await response.text();
    shadowRoot.appendChild(content);

    shadowRoot.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href')?.slice(1);
        if (!targetId) return;

        const target = shadowRoot.getElementById(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  } catch (err) {
    host.textContent = 'Unable to load About content.';
    console.error(err);
  }
}

loadAboutContent();

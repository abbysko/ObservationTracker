async function loadMarketingContent() {
  const target = document.querySelector('#marketing-content');
  if (!target) return;

  try {
    const response = await fetch('marketing-content.html');
    if (!response.ok) throw new Error('Failed to load marketing content');
    target.innerHTML = await response.text();
  } catch (err) {
    target.innerHTML = '<p>Unable to load marketing content.</p>';
    console.error(err);
  }
}

loadMarketingContent();

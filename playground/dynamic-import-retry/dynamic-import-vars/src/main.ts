const btn = document.querySelector<HTMLButtonElement>('#btn-vars')!

btn.addEventListener('click', async () => {
  const lang = 'en'
  const res = await import(`./locales/${lang}.ts`)
  console.log(res.default)
})

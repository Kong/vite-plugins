const btnA = document.querySelector<HTMLButtonElement>('#btn-simple')!
const btnB = document.querySelector<HTMLButtonElement>('#btn-transitive')!

btnA.addEventListener('click', async () => {
  const { value } = await import('./simple')
  console.log(value)
})

btnB.addEventListener('click', async () => {
  const { value } = await import('./transitive')
  console.log(value)
})


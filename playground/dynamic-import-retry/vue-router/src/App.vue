<template>
  <h1>Hello App!</h1>
  <nav>
    <RouterLink
      id="nav-home"
      to="/"
    >
      Go to Home
    </RouterLink>
    <RouterLink
      id="nav-about"
      to="/about"
    >
      Go to About
    </RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

# Corvid

fear the crow

![crowtein](https://github.com/user-attachments/assets/b3bbf267-d7b0-4116-80a5-b932b409a111)

## Usage

Non-exhastive list of features

### DOM

```js
import { dom } from '@taybart/corvid'

dom.ready(() => {
    // query for existing element
    const username = new dom.el('#username')
    // listen for events
    username.on('click', () => {
        // set style, will kebab keys backgroundColor -> background-color
        username.style({ color: 'red', backgroundColor: 'yellow' })
        // set/get content
        username.content(`evil: ${username.value()}`)
    }))


    // create new elements
    new dom.el({
        type: 'div',
        id: 'hair-color',
        class: 'hair user-info',
        content: 'blue',
        // will append element to username
        parent: username,
    })

    // listen for keys and check for modifiers
    dom.onKey('E', ({ ctrl, alt, meta, shift }) => {
        console.log('E pressed')
    })
})
```

### LocalStorage

```js
import { ls, dom } from '@taybart/corvid'

dom.ready(() => {
  const hpStat = new dom.el({ query: '#stat-hp', content: ls.get('stats.hp') })
  // set element content when localstorage changes
  ls.listen('stats.hp', hpStat)
  // or just a callback
  ls.listen('stats.hp', ({ key, value }) => {
    console.log(`health is now ${value}`)
  })
  // set a value (required if listening for events)
  ls.set('stats.hp', ls.get('stats.hp') - 1))
  // set a flattened object, will update "stats.hp" and "stats.attack"
  ls.set({ stats: { hp: 100, attack: 10 } })
})
```

### Network

```js
import { network } '@taybart/corvid'

// create an api client
const api = network.create({
  url: 'https://api.example.com',
  credentials: 'include',
  success: 250, // odd success code
  // corvid params, string, or custom object that has .toString() and renders url safe params
  params: new network.params({hello: 'corvid'})
})

// make a request
const { username } = await api.do({
    path: '/users/1',
    override: {
        params: network.params.render({hello: 'world!'}) , // only for this request
    },
})


```

### Styles

```js
import { style } '@taybart/corvid'

// query css media prefers-color-scheme
if (style.isDarkMode()) {
    console.log('dark mode')
}
// listen for theme switch
style.onDarkMode((isDark) => {
    // set document attribute 'data-theme'
    style.switchTheme(isDark ? 'light' : 'dark')
    // get css variables
    console.log(`is dark mode: ${isDark} and background is ${style.cssVar('--color-bg')`)
})
```

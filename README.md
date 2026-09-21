# Corvid

<p align="center"><img src="https://github.com/user-attachments/assets/b3bbf267-d7b0-4116-80a5-b932b409a111" width="100" height="100"></p>

<p align="center">fear the crow</p>


<!-- ![crowtein](https://github.com/user-attachments/assets/b3bbf267-d7b0-4116-80a5-b932b409a111) -->

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
    dom.create({
        tag: 'div',
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

class Card extends dom.component {
    static tag = 'x-card'
    static observedAttributes = ['name']
    // will be applied to all instances of this class in adopted stylesheet
    static styles = {
        display: 'flex',
        flexDirection: 'column',
    }
    // component should use a shadow dom, styles will be applied to shadow root if this is set
    static shadow = {open: 'true'}
    mount() {
    }
    // called for change to an attribute named in `static observedAttributes`
    onAttr(name, value, prev) {
    }
}
Card.register() // register the component
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
  success: 250, // check for non-200 success code
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

Just handle switching automatically

```html
<script type='module'>
    import { handleThemeSwitch } from '@taybart/corvid/style'
    handleThemeSwitch()
</script>
```

### QR

```js
import { dom } from '@taybart/corvid'
import { QR } '@taybart/corvid/qr'

const el = new dom.el('#qr')
QR.render({
    text: 'https://example.com',
    size: 200,
}, el) // can also be regular element query -> document.getElementById('qr')
```

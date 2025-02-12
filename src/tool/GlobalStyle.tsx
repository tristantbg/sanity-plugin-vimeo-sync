import {createGlobalStyle} from 'styled-components'

const GlobalStyle = createGlobalStyle`
  .container > div {
    padding: 2rem;
  }

  .container > div {
    display: flex;
    flex-direction: column;
  }

  .icon {
    margin-right: 0.5em;
    font-size: 1.5em;
    margin-top: 0.2em;
  }

  button {
    cursor: pointer;
    appearance: none;
    border: none;
    padding: 2em;
    font-size: 1em;
    font-weight: 600;
    background: black;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  p {
    margin: 0;
    line-height: 1.5;
  }

`

export default GlobalStyle

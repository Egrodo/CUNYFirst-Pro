export default `
  #CUNYFIRST_PRO-Container {
    position: fixed;
    top: 0;
    right: 10px;
    max-width: 500px;
    max-height: 500px;
    padding: 1em 2em;
    color: #00A58E;
    font-family: arial;
    box-shadow: inset 0 0 20px 5px #3065c5;
    background: #FFF0EA;
    border-radius: 5px;
  }

  #CUNYFIRST_PRO-Content::-webkit-scrollbar, #CUNYFIRST_PRO-Content::-webkit-scrollbar-thumb, #CUNYFIRST_PRO-Content::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  #CUNYFIRST_PRO-Header {
    width: 100%;
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    height: 3em;
  }

  #CUNYFIRST_PRO-Header h1 {
    color: #5555cd;
    margin: 0;
    font-size: 1.2em;
  }

  #CUNYFIRST_PRO-Header h2 {
    margin: 0;
    font-size: .8em;
  }

  #CUNYFIRST_PRO-Header button {
    position: absolute;
    top: 0;
    right: 0;
    outline: none;
    padding: 0;
    background: #ca3c3c;
    font-size: 1.5em;
    height: 30px;
    color: white;
    border: none;
    width: 30px;
    line-height: 30px;
    cursor: pointer;
  }

  #CUNYFIRST_PRO-Content {
    max-height: 400px;
    overflow-y: scroll;
  }

  #CUNYFIRST_PRO-Content h2, #CUNYFIRST_PRO-Content h4 {
    margin: 0;
  }

  #CUNYFIRST_PRO-Content article {
    display: grid;
    grid-template-columns: 0.5fr 1.5fr;
    grid-template-rows: 1fr;
    grid-template-areas: ". .";
    
    max-height: 150px;
    margin-bottom: 2em;
    background-color: #f9f9f9;
    border-radius: 5px;
  }

  #CUNYFIRST_PRO-Content article aside {
    padding: .5em;
  }

  #CUNYFIRST_PRO-Content article aside h2 {
    font-size: 1.2em;
    margin-bottom: .5em;
  }

  #CUNYFIRST_PRO-Content article aside h4 {
    font-size: .75em;
  }

  #CUNYFIRST_PRO-Content article aside h4:not(first-of-type) {
    margin-top: .5em;
  }

  #CUNYFIRST_PRO-Content article main {
    margin-top: .5em;
    overflow: scroll;
    text-indent: 1em;
  }
  
  #CUNYFIRST_PRO-Content article main::-webkit-scrollbar {
    width: 8px;
    background-color: transparent;
  }
  
  #CUNYFIRST_PRO-Content article main::-webkit-scrollbar-thumb {
    background-color: gray;
    border-radius: 15px;
  }
  
  #CUNYFIRST_PRO-Content article main::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  #CUNYFIRST_PRO-RemainingContainer {
    width: 100%;
    text-align: center;
    height: 2em;
  }
  
  #CUNYFIRST_PRO-RemainingContainer a {
    text-decoration: none;
    font-size: 1.1em;
    color: #5555cd;
  }
  
  #CUNYFIRST_PRO-RemainingContainer a:hover {
    text-decoration: underline;
  }

  #CUNYFIRST_PRO-RemainingContainer a:visited {
    color: #5555cd;
  }
`;
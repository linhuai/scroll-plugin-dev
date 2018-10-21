var $list = document.querySelector('#list')
let $li = createTag('li')
let i = 0
while(list[++i]) {
  $list.appendChild($li(list[i]))
}
function createTag (tag) {
  return function (val) {
    let $node = document.createElement(tag)
    $textNode = document.createTextNode(val)
    $node.appendChild($textNode)
    return $node
  }
  return $node
}

// 初始化 scroll
const scroll = new Scroll('#wrap', {

})
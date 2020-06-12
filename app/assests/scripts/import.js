// 获得所有导入的html模板
const links = document.querySelectorAll('link[rel="import"]');
const defaultPage = ".section-wordlist";

// import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
    // querySelector 查找节点
    let template = link.import.querySelector('.task-template');
    // importNode 将节点复制到document下 true为深度复制
    // ！模板 元素在其 HTMLTemplateElement.content 属性中包含了一个 DocumentFragment。 
    let clone = document.importNode(template.content, true);
    if (link.href.match('about.html')) {
        document.querySelector('body').appendChild(clone);
    }
    else {
        document.querySelector('.content').appendChild(clone);
    }
})
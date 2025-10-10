function max()
{    
    a = parseFloat(document.getElementById("hsa").value)
    b = parseFloat(document.getElementById("hsb").value)
    c = parseFloat(document.getElementById("hsc").value)
    max = Math.max(a, b, c)
    result = document.getElementById("tdresult")
    result.innerText = max
}

function min() 
{
    a = parseFloat(document.getElementById("hsa").value)
    b = parseFloat(document.getElementById("hsb").value)
    c = parseFloat(document.getElementById("hsc").value)
    min = Math.min(a, b, c)
    result = document.getElementById("tdresult")
    result.innerText = min
}

function sin()
{
    a = parseFloat(document.getElementById("hsa").value)
    result = document.getElementById("tdresult")
    result.innerText = Math.sin(a)
            
}
function cos() 
{
    a = parseFloat(document.getElementById("hsa").value)
    result = document.getElementById("tdresult")
    result.innerText = Math.cos(a)
            
}
function exponential()
{
    a = parseFloat(document.getElementById("hsa").value)
    b = parseFloat(document.getElementById("hsb").value)
    result = document.getElementById("tdresult")
    result.innerText = Math.pow(a, b)
            
}
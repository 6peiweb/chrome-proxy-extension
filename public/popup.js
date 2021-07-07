var btn = document.getElementById('btn');
function clickhandler() {
    var v = btn.innerText;
    console.log(v);
    btn.innerText = String(v + 1)
}

btn.addEventListener('click', clickhandler);
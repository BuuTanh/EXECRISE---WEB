function Process() 
{
    var a = document.getElementById("firstNumber");
    var b = document.getElementById("secondNumber");
    var c = document.getElementById("thirdNumber");
    var delta = b.value * b.value - 4 * a.value * c.value;
    if (a.value == 0) {
        document.getElementById("result").value = "N/A";
    } else if (delta == 0) {
        var x = -b.value / (2 * a.value);
        document.getElementById("result").value = "x1=x2= " + x;
    } else if (delta < 0) {
        document.getElementById("result").value = "No result";
    } else {
        var x1 = (-b.value - Math.sqrt(delta)) / (2 * a.value);
        var x2 = (-b.value + Math.sqrt(delta)) / (2 * a.value);
        document.getElementById("result").value = "x1 = " + x1 + ", x2 = " + x2;
    }
}
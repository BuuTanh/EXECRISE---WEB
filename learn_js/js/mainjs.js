function first_degree(a,b)
{
    if(a==0 && b==0)
        return "INF"
    if(a==0 && b!=0)
        return "No Solution"
    return Math.round(-b/a,2)
}
function call_first_degree(a_coeff,b_coeff,result1,result2)
{
    r=first_degree(a_coeff,b_coeff)
    result1.value=r
    result2.innerText=r
}

function is_leap_year(year)
{
   if((year%4==0 && year%100!=0) || (year%400==0))
         return true
    else
         return false
}
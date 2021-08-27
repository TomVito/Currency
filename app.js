const {currency, currencies}=require('./currency');
const http=require('http');
const fs=require('fs');
const path=require('path');

function generateCurrencySelect(cs, name){
    let s='<select class="form-control select2" name="'+name+'">';
    cs.forEach((d)=>{
        s+="<option value='"+d.code+"'>"+"("+d.code+") "+d.name+"</option>";
    })
    s+="</select>";
    return s;
}

const server=http.createServer((req,res)=>{
    let url=req.url;

    if (url==='/'){
        currencies((cs)=>{
            let stream=fs.readFileSync('./template/index.html', 'utf-8');
            stream=stream.replace('{{currencies}}', generateCurrencySelect(cs, 'from'));
            stream=stream.replace('{{currencies2}}', generateCurrencySelect(cs, 'to'));
            res.setHeader('Content-Type', 'text/html');
            res.write(stream);
            return res.end();
        });
    }

    let getData=url.split('?');
    if (getData[0]==='/convert'){
        let from=getData[1].split('&')[0].split('=')[1];
        let to=getData[1].split('&')[1].split('=')[1];

        currencies((cs)=>{
            currency(from, to, (rates)=>{
                res.setHeader('Content-Type', 'text/html');
                let s='<table class="table">';
                rates.forEach((d)=>{
                s+='<tr><td>'+d.date+'</td><td>'+d.rate+'</td></tr>';
                });
                s+='</table>';
                let stream=fs.readFileSync('./template/temp.html', 'utf-8');
                stream=stream.replace('{{currencies}}', generateCurrencySelect(cs, 'from'));
                stream=stream.replace('{{currencies2}}', generateCurrencySelect(cs, 'to'));
                stream=stream.replace('{{currency}}', from+" to "+to);
                stream=stream.replace('{{rates}}', s);

                const chartData=[];
                rates.forEach((d)=>{
                    chartData.push({
                        x:d.date.slice(5, 10),
                        y:d.rate
                    });
                });
                stream=stream.replace('RatesData', JSON.stringify(chartData));

                res.write(stream);
                res.end();
            });
        });
    }
});

server.listen(3000, 'localhost');
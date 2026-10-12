// TalentPact · 05-qr
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// TPQr — generador de códigos QR local (sin servicios de terceros).
// El QR de un SkillPass contiene el hash de la credencial: enviarlo a una API
// externa filtraría metadatos de cada candidato, así que se dibuja aquí mismo.
// Modo byte · corrección de errores M · versiones 1-15 · salida SVG.
// ═══════════════════════════════════════════════════════════════════════════
var TPQr=(function(){
  // ── GF(256) para Reed-Solomon ──
  var EXP=new Array(512),LOG=new Array(256);
  (function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11d;}
   for(var j=255;j<512;j++)EXP[j]=EXP[j-255];})();
  function mul(a,b){return (a===0||b===0)?0:EXP[LOG[a]+LOG[b]];}

  function rsGen(n){
    var g=[1];
    for(var i=0;i<n;i++){
      var h=new Array(g.length+1);
      for(var k=0;k<h.length;k++){
        h[k]=(k<g.length?g[k]:0)^(k>0?mul(g[k-1],EXP[i]):0);
      }
      g=h;
    }
    return g;
  }
  function rsEncode(data,ecLen){
    var gen=rsGen(ecLen),res=new Array(ecLen);
    for(var i=0;i<ecLen;i++)res[i]=0;
    for(var d=0;d<data.length;d++){
      var factor=data[d]^res[0];
      res.shift();res.push(0);
      if(factor!==0)for(var j=0;j<ecLen;j++)res[j]^=mul(gen[j+1],factor);
    }
    return res;
  }

  // [ecCodewordsPorBloque, bloquesG1, datosG1, bloquesG2, datosG2] — nivel M.
  var ECC_M=[null,
    [10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
    [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44],
    [30,1,50,4,51],[22,6,36,2,37],[22,8,37,1,38],[24,4,40,5,41],[24,5,41,5,42]];
  var ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],
    [6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70]];

  function utf8(s){
    var out=[];
    for(var i=0;i<s.length;i++){
      var c=s.charCodeAt(i);
      if(c<0x80)out.push(c);
      else if(c<0x800){out.push(0xc0|(c>>6),0x80|(c&63));}
      else if(c>=0xd800&&c<0xdc00&&i+1<s.length){
        var c2=s.charCodeAt(++i),cp=0x10000+((c-0xd800)<<10)+(c2-0xdc00);
        out.push(0xf0|(cp>>18),0x80|((cp>>12)&63),0x80|((cp>>6)&63),0x80|(cp&63));
      }
      else out.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));
    }
    return out;
  }

  function bchDigit(d){var n=0;while(d!==0){n++;d>>>=1;}return n;}
  function formatInfo(data){ // BCH(15,5) + máscara estándar
    var d=data<<10;
    while(bchDigit(d)-bchDigit(0x537)>=0)d^=0x537<<(bchDigit(d)-bchDigit(0x537));
    return ((data<<10)|d)^0x5412;
  }
  function versionInfo(ver){ // BCH(18,6)
    var d=ver<<12;
    while(bchDigit(d)-bchDigit(0x1F25)>=0)d^=0x1F25<<(bchDigit(d)-bchDigit(0x1F25));
    return (ver<<12)|d;
  }

  function maskFn(n,i,j){
    switch(n){
      case 0:return (i+j)%2===0;
      case 1:return i%2===0;
      case 2:return j%3===0;
      case 3:return (i+j)%3===0;
      case 4:return (Math.floor(i/2)+Math.floor(j/3))%2===0;
      case 5:return ((i*j)%2)+((i*j)%3)===0;
      case 6:return (((i*j)%2)+((i*j)%3))%2===0;
      default:return (((i+j)%2)+((i*j)%3))%2===0;
    }
  }

  function penalty(m){
    var n=m.length,score=0,i,j,run,k;
    // N1 — cinco o más módulos seguidos del mismo color.
    for(i=0;i<n;i++){
      run=1;
      for(j=1;j<n;j++){
        if(m[i][j]===m[i][j-1])run++;
        else{if(run>=5)score+=3+(run-5);run=1;}
      }
      if(run>=5)score+=3+(run-5);
      run=1;
      for(j=1;j<n;j++){
        if(m[j][i]===m[j-1][i])run++;
        else{if(run>=5)score+=3+(run-5);run=1;}
      }
      if(run>=5)score+=3+(run-5);
    }
    // N2 — bloques 2x2 del mismo color.
    for(i=0;i<n-1;i++)for(j=0;j<n-1;j++){
      var v=m[i][j];
      if(v===m[i][j+1]&&v===m[i+1][j]&&v===m[i+1][j+1])score+=3;
    }
    // N3 — patrón 1:1:3:1:1 con cuatro módulos claros a un lado.
    var pat=[1,0,1,1,1,0,1,0,0,0,0],pat2=[0,0,0,0,1,0,1,1,1,0,1];
    for(i=0;i<n;i++)for(j=0;j<=n-11;j++){
      var okA=true,okB=true,okC=true,okD=true;
      for(k=0;k<11;k++){
        if(m[i][j+k]!==pat[k])okA=false;
        if(m[i][j+k]!==pat2[k])okB=false;
        if(m[j+k][i]!==pat[k])okC=false;
        if(m[j+k][i]!==pat2[k])okD=false;
      }
      if(okA)score+=40; if(okB)score+=40; if(okC)score+=40; if(okD)score+=40;
    }
    // N4 — desviación respecto al 50% de módulos oscuros.
    var dark=0;
    for(i=0;i<n;i++)for(j=0;j<n;j++)if(m[i][j])dark++;
    score+=Math.floor(Math.abs(dark*100/(n*n)-50)/5)*10;
    return score;
  }

  /** Matriz de módulos (0/1) del QR que codifica `text`. */
  function matrix(text){
    var bytes=utf8(String(text)),ver=-1,spec=null,cap=0;
    for(var v=1;v<ECC_M.length;v++){
      var s=ECC_M[v],total=s[1]*s[2]+s[3]*s[4],countBits=v<10?8:16;
      if(4+countBits+8*bytes.length<=total*8){ver=v;spec=s;cap=total;break;}
    }
    if(ver<0)throw new Error('Texto demasiado largo para un QR de versión 15');

    // ── Flujo de bits: modo byte + longitud + datos + relleno ──
    var bits=[];
    function put(val,len){for(var i=len-1;i>=0;i--)bits.push((val>>i)&1);}
    put(4,4);
    put(bytes.length,ver<10?8:16);
    for(var b=0;b<bytes.length;b++)put(bytes[b],8);
    var capBits=cap*8;
    put(0,Math.min(4,capBits-bits.length));
    while(bits.length%8)bits.push(0);
    var dataCw=[];
    for(var i=0;i<bits.length;i+=8){
      var byte=0;
      for(var j=0;j<8;j++)byte=(byte<<1)|bits[i+j];
      dataCw.push(byte);
    }
    var pad=[0xEC,0x11],p=0;
    while(dataCw.length<cap)dataCw.push(pad[p++%2]);

    // ── Bloques + Reed-Solomon + entrelazado ──
    var blocks=[],ecBlocks=[],off=0,bi;
    for(bi=0;bi<spec[1];bi++){var d1=dataCw.slice(off,off+spec[2]);off+=spec[2];blocks.push(d1);ecBlocks.push(rsEncode(d1,spec[0]));}
    for(bi=0;bi<spec[3];bi++){var d2=dataCw.slice(off,off+spec[4]);off+=spec[4];blocks.push(d2);ecBlocks.push(rsEncode(d2,spec[0]));}
    var out=[],maxD=Math.max(spec[2],spec[4]);
    for(i=0;i<maxD;i++)for(bi=0;bi<blocks.length;bi++)if(i<blocks[bi].length)out.push(blocks[bi][i]);
    for(i=0;i<spec[0];i++)for(bi=0;bi<ecBlocks.length;bi++)out.push(ecBlocks[bi][i]);

    // ── Patrones fijos ──
    var size=17+4*ver,m=[],res=[],r,c;
    for(r=0;r<size;r++){m.push(new Array(size).fill(0));res.push(new Array(size).fill(false));}

    function finder(fr,fc){
      for(var i=-1;i<=7;i++)for(var j=-1;j<=7;j++){
        var rr=fr+i,cc=fc+j;
        if(rr<0||cc<0||rr>=size||cc>=size)continue;
        var on=(i>=0&&i<=6&&(j===0||j===6))||(j>=0&&j<=6&&(i===0||i===6))||(i>=2&&i<=4&&j>=2&&j<=4);
        m[rr][cc]=on?1:0;res[rr][cc]=true;
      }
    }
    finder(0,0);finder(0,size-7);finder(size-7,0);

    for(i=0;i<size;i++){
      if(!res[6][i]){m[6][i]=(i%2===0)?1:0;res[6][i]=true;}
      if(!res[i][6]){m[i][6]=(i%2===0)?1:0;res[i][6]=true;}
    }

    var ap=ALIGN[ver];
    for(var a=0;a<ap.length;a++)for(var bb=0;bb<ap.length;bb++){
      var ar=ap[a],ac=ap[bb];
      if((ar===6&&ac===6)||(ar===6&&ac===size-7)||(ar===size-7&&ac===6))continue;
      for(i=-2;i<=2;i++)for(j=-2;j<=2;j++){
        m[ar+i][ac+j]=(Math.max(Math.abs(i),Math.abs(j))!==1)?1:0;
        res[ar+i][ac+j]=true;
      }
    }

    // Módulo oscuro fijo + zonas reservadas de formato y versión.
    m[size-8][8]=1;res[size-8][8]=true;
    for(i=0;i<9;i++){res[8][i]=true;res[i][8]=true;}
    for(i=0;i<8;i++){res[8][size-1-i]=true;res[size-1-i][8]=true;}
    if(ver>=7){
      for(i=0;i<6;i++)for(j=0;j<3;j++){res[i][size-11+j]=true;res[size-11+j][i]=true;}
    }

    // ── Colocación de datos en zigzag desde abajo a la derecha ──
    var dir=-1,row=size-1,idx=0;
    for(var col=size-1;col>0;col-=2){
      if(col===6)col--;
      for(;;){
        for(var k=0;k<2;k++){
          var cc2=col-k;
          if(!res[row][cc2]){
            var bit=0;
            if(idx<out.length*8)bit=(out[idx>>3]>>(7-(idx&7)))&1;
            idx++;
            m[row][cc2]=bit;
          }
        }
        row+=dir;
        if(row<0||row>=size){row-=dir;dir=-dir;break;}
      }
    }

    // ── Máscara: se prueban las 8 y gana la de menor penalización ──
    var best=null,bestScore=Infinity,bestMask=0;
    for(var mask=0;mask<8;mask++){
      var cand=[];
      for(r=0;r<size;r++){
        cand.push(m[r].slice());
        for(c=0;c<size;c++)if(!res[r][c]&&maskFn(mask,r,c))cand[r][c]^=1;
      }
      applyFormat(cand,mask,size);
      if(ver>=7)applyVersion(cand,ver,size);
      var sc=penalty(cand);
      if(sc<bestScore){bestScore=sc;best=cand;bestMask=mask;}
    }
    return best;
  }

  function applyFormat(cand,mask,size){
    var bits=formatInfo((0<<3)|mask); // nivel M = 0
    for(var i=0;i<15;i++){
      var on=((bits>>i)&1)===1?1:0;
      if(i<6)cand[i][8]=on;
      else if(i<8)cand[i+1][8]=on;
      else cand[size-15+i][8]=on;
    }
    for(var j=0;j<15;j++){
      var on2=((bits>>j)&1)===1?1:0;
      if(j<8)cand[8][size-j-1]=on2;
      else if(j<9)cand[8][15-j-1+1]=on2;
      else cand[8][15-j-1]=on2;
    }
    cand[size-8][8]=1;
  }
  function applyVersion(cand,ver,size){
    var bits=versionInfo(ver);
    for(var i=0;i<18;i++){
      var on=((bits>>i)&1)===1?1:0;
      cand[Math.floor(i/3)][(i%3)+size-8-3]=on;
      cand[(i%3)+size-8-3][Math.floor(i/3)]=on;
    }
  }

  /** SVG autocontenido con el QR de `text`. */
  function svg(text,opts){
    opts=opts||{};
    var m=matrix(text),n=m.length,q=opts.quiet==null?3:opts.quiet,total=n+2*q;
    var fg=opts.fg||'#0f172a',bg=opts.bg||'#ffffff';
    var d='';
    for(var r=0;r<n;r++){
      var c=0;
      while(c<n){
        if(!m[r][c]){c++;continue;}
        var start=c;
        while(c<n&&m[r][c])c++;
        d+='M'+(start+q)+' '+(r+q)+'h'+(c-start)+'v1h-'+(c-start)+'z';
      }
    }
    var label=opts.label||'Código QR';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+total+' '+total+
      '" shape-rendering="crispEdges" role="img" aria-label="'+
      String(label).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];})+
      '"><rect width="'+total+'" height="'+total+'" fill="'+bg+'"/><path d="'+d+'" fill="'+fg+'"/></svg>';
  }

  return {matrix:matrix,svg:svg};
})();


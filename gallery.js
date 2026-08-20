const items = [...document.querySelectorAll('.gallery-item img')];
    const lb = document.getElementById('lb');
    const lbImg = document.getElementById('lb-img');
    const lbCap = document.getElementById('lb-caption');
    let current = 0;
    function openLB(i){current=i;lbImg.src=items[current].src;lbCap.textContent=items[current].dataset.caption||'';lb.classList.add('open');}
    function closeLB(){lb.classList.remove('open');lbImg.src='';}
    document.querySelectorAll('.gallery-item').forEach((el,i)=>el.addEventListener('click',()=>openLB(i)));
    document.getElementById('lb-close').addEventListener('click',closeLB);
    document.getElementById('lb-prev').addEventListener('click',()=>openLB((current-1+items.length)%items.length));
    document.getElementById('lb-next').addEventListener('click',()=>openLB((current+1)%items.length));
    lb.addEventListener('click',e=>{if(e.target===lb)closeLB()});
    document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLB();if(e.key==='ArrowLeft')openLB((current-1+items.length)%items.length);if(e.key==='ArrowRight')openLB((current+1)%items.length);});

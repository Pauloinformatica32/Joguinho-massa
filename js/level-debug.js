export function drawLevelDebug(c,map,camera,canvas){
 c.save();c.translate(-camera.x,-camera.y);c.font='10px monospace';c.lineWidth=1;
 const visible=o=>o.x+(o.w||380)>camera.x&&o.x-380<camera.x+canvas.width;
 for(const p of map.platforms.filter(visible)){c.fillStyle=c.strokeStyle=p.route==='optional'?'#d996ff':'#7edfff';c.strokeRect(p.x,p.y,p.w,p.h);if(p.id)c.fillText(p.id,p.x,p.y-5)}
 for(const h of map.hazards.filter(visible)){c.strokeStyle='#ff715d';c.strokeRect(h.x,h.y,h.w,h.h)}
 for(const h of map.hookPoints.filter(visible)){c.strokeStyle='#f8d97b55';c.setLineDash([5,8]);c.beginPath();c.arc(h.x,h.y,380,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#ffdc8c';c.fillText(h.id||'arena',h.x-30,h.y-15)}
 for(const cp of map.checkpoints.filter(visible)){c.fillStyle='#91ffae';c.fillRect(cp.x,690,2,100);c.fillText(cp.id,cp.x-45,680)}
 for(const t of map.terminals.filter(visible)){c.fillStyle='#f9bdf3';c.fillText(t.id,t.x-30,t.y-90)}
 for(const r of map.routes.filter(visible)){c.fillStyle=r.route==='optional'?'#e2a9ff':'#83efff';c.fillText(r.route==='optional'?'◇ OPCIONAL':'→ ROTA',r.x-35,r.y-20)}
 c.restore();c.save();c.fillStyle='#07111fee';c.fillRect(12,170,500,25);c.fillStyle='#abfff1';c.font='11px monospace';c.fillText('SHIFT+F3 ROTAS · CIANO: principal · LILÁS: opcional',20,187);c.restore();
}

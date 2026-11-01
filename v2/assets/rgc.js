/* ============================================================
   RICH GIRL CODE™ — motion & interaction layer
   Every effect is additive: the page renders complete at rest,
   and all motion is skipped under prefers-reduced-motion.
   ============================================================ */
(function(){
  "use strict";
  var root=document.documentElement;
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine=window.matchMedia("(pointer: fine)").matches;
  var hasGSAP=typeof window.gsap!=="undefined";

  var yr=document.getElementById("yr");
  if(yr){yr.textContent=String(new Date().getFullYear());}

  /* ── ecosystem index: one generative panel per house ── */
  var rows=[].slice.call(document.querySelectorAll("#ecoList .eco__row"));
  var stage=document.getElementById("ecoStage");
  var panels=[];
  if(rows.length&&stage){
    rows.forEach(function(row,i){
      var accent=row.style.getPropertyValue("--row-accent").trim()||"#C8A253";
      var nameEl=row.querySelector(".eco__name");
      var p=document.createElement("div");
      p.className="eco__panel"+(i===0?" is-on":"");
      p.style.background=
        "radial-gradient(64% 50% at "+(22+(i%3)*26)+"% "+(20+(i%4)*18)+"%,"+accent+"BF,transparent 70%),"+
        "radial-gradient(54% 44% at "+(78-(i%3)*22)+"% "+(74-(i%2)*16)+"%,rgba(200,162,83,.30),transparent 72%),"+
        "linear-gradient("+(140+i*9)+"deg,#1B1B1E,#0A0A0B)";
      var cap=document.createElement("i");
      cap.textContent=nameEl?nameEl.textContent:"";
      p.appendChild(cap);
      stage.appendChild(p);
      panels.push(p);
    });
    var activate=function(i){
      rows.forEach(function(r,n){r.classList.toggle("is-on",n===i);});
      panels.forEach(function(p,n){p.classList.toggle("is-on",n===i);});
    };
    rows.forEach(function(row,i){
      var link=row.querySelector(".eco__link");
      if(!link){return;}
      if(fine){row.addEventListener("mouseenter",function(){activate(i);});}
      link.addEventListener("focus",function(){activate(i);});
      link.addEventListener("click",function(e){
        if(link.getAttribute("href")==="#"){e.preventDefault();activate(i);}
      });
    });
  }

  /* ── gold dollar cursor ── */
  var cur=document.getElementById("cursor");
  if(cur&&fine&&!reduced){
    root.classList.add("has-cursor");
    var cx=window.innerWidth/2,cy=window.innerHeight/2,tx=cx,ty=cy,raf=null;
    var tick=function(){
      cx+=(tx-cx)*0.16; cy+=(ty-cy)*0.16;
      cur.style.transform="translate3d("+cx.toFixed(1)+"px,"+cy.toFixed(1)+"px,0)";
      if(Math.abs(tx-cx)>0.4||Math.abs(ty-cy)>0.4){raf=requestAnimationFrame(tick);}else{raf=null;}
    };
    window.addEventListener("pointermove",function(e){
      tx=e.clientX;ty=e.clientY;
      if(!raf){raf=requestAnimationFrame(tick);}
    },{passive:true});
    document.addEventListener("pointerover",function(e){
      var t=e.target;
      var hot=t&&t.closest&&t.closest("a,button,input,.jcard,.shop,.eco__row,.strip a");
      cur.classList.toggle("is-hot",!!hot);
    },{passive:true});
  }

  /* ── newsletter: states the truth, never a fake success ── */
  var form=document.getElementById("signup");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var note=document.getElementById("signupNote");
      if(note){note.textContent="Connect the live list endpoint to enable sign-ups.";}
    });
  }

  if(reduced||!hasGSAP){return;}
  gsap.registerPlugin(window.ScrollTrigger);

  /* ── split a headline into animatable characters ── */
  function splitChars(el){
    var out=[];
    [].slice.call(el.childNodes).forEach(function(node){
      if(node.nodeType===3){
        var frag=document.createDocumentFragment();
        node.textContent.split("").forEach(function(c){
          if(c===" "){frag.appendChild(document.createTextNode(" "));return;}
          var s=document.createElement("span");
          s.className="ch";s.textContent=c;frag.appendChild(s);out.push(s);
        });
        node.parentNode.replaceChild(frag,node);
      }else if(node.nodeType===1&&node.tagName!=="SUP"){
        out=out.concat(splitChars(node));
      }else if(node.nodeType===1){
        out.push(node);
      }
    });
    return out;
  }
  var title=document.querySelector(".hero__title");
  var chars=title?splitChars(title):[];

  /* ── cinematic entrance ── */
  var mark=document.getElementById("curtainMark");
  var markChars=[];
  if(mark){
    var txt=mark.textContent;mark.textContent="";
    txt.split("").forEach(function(c){
      var s=document.createElement("span");
      s.textContent=(c===" ")?" ":c;
      mark.appendChild(s);markChars.push(s);
    });
  }
  root.classList.add("is-entering");
  var intro=gsap.timeline({onComplete:function(){
    root.classList.remove("is-entering");
    window.ScrollTrigger.refresh();
  }});
  intro.from(markChars,{yPercent:120,opacity:0,duration:.5,ease:"power3.out",stagger:.018})
       .to(".curtain__line i",{scale:"1 1",duration:.55,ease:"power2.inOut"},"-=.28")
       .to(markChars,{yPercent:-110,opacity:0,duration:.38,ease:"power3.in",stagger:.01},"+=.05")
       .to(".curtain",{yPercent:-101,duration:.72,ease:"expo.inOut"},"-=.22")
       .from(chars,{yPercent:118,opacity:0,duration:.9,ease:"expo.out",stagger:.028},"-=.5")
       .from(".hero .eyebrow, .hero__tag, .scrollcue",
             {y:22,opacity:0,duration:.7,ease:"power3.out",stagger:.1},"-=.6");

  /* ── parallax ── */
  if(document.querySelector(".hero")){
    gsap.to(".hero__glow",{yPercent:16,ease:"none",
      scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
    gsap.to(".hero__title",{yPercent:-13,opacity:.5,ease:"none",
      scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
  }
  gsap.utils.toArray(".frame__art").forEach(function(a){
    gsap.fromTo(a,{yPercent:-7},{yPercent:7,ease:"none",
      scrollTrigger:{trigger:a.parentNode,start:"top bottom",end:"bottom top",scrub:true}});
  });

  /* ── scroll-driven typographic band ── */
  var track=document.getElementById("bandTrack");
  if(track){
    gsap.fromTo(track,{xPercent:0},{xPercent:-50,ease:"none",
      scrollTrigger:{trigger:".band",start:"top bottom",end:"bottom top",scrub:.6}});
  }

  /* ── section reveals, each from a visible resting state ── */
  gsap.utils.toArray(".sec__head").forEach(function(h){
    gsap.from(h.children,{y:34,opacity:0,duration:.9,ease:"expo.out",stagger:.12,
      scrollTrigger:{trigger:h,start:"top 86%"}});
  });
  if(document.getElementById("ecoList")){
    gsap.from("#ecoList .eco__row",{y:26,opacity:0,duration:.7,ease:"power3.out",stagger:.055,
      scrollTrigger:{trigger:"#ecoList",start:"top 82%"}});
  }
  gsap.utils.toArray(".frame__veil").forEach(function(v){
    gsap.to(v,{scaleY:0,duration:1.25,ease:"expo.inOut",
      scrollTrigger:{trigger:v.parentNode,start:"top 78%"}});
  });
  gsap.utils.toArray(".jgrid").forEach(function(g){
    gsap.from(g.children,{y:44,opacity:0,duration:.85,ease:"expo.out",stagger:.1,
      scrollTrigger:{trigger:g,start:"top 84%"}});
  });
  gsap.utils.toArray(".rail").forEach(function(r){
    gsap.from(r.children,{y:40,opacity:0,duration:.8,ease:"expo.out",stagger:.08,
      scrollTrigger:{trigger:r,start:"top 86%"}});
  });
  gsap.utils.toArray(".two").forEach(function(g){
    gsap.from(g.children,{y:38,opacity:0,duration:.85,ease:"expo.out",stagger:.1,
      scrollTrigger:{trigger:g,start:"top 86%"}});
  });
  gsap.utils.toArray(".steps").forEach(function(s){
    gsap.from(s.children,{y:24,opacity:0,duration:.7,ease:"power3.out",stagger:.05,
      scrollTrigger:{trigger:s,start:"top 84%"}});
  });
  gsap.utils.toArray(".strip").forEach(function(s){
    gsap.from(s.children,{y:22,opacity:0,duration:.7,ease:"power3.out",stagger:.05,
      scrollTrigger:{trigger:s,start:"top 90%"}});
  });
})();

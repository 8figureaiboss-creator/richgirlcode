/* ============================================================
   RICH GIRL CODE™ — behaviour & motion layer
   Interaction (nav, search, rail, form) works without GSAP.
   Motion is additive: pages render complete at rest, and all
   animation is skipped under prefers-reduced-motion.
   ============================================================ */
(function(){
  "use strict";
  var root=document.documentElement;
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine=window.matchMedia("(pointer: fine)").matches;
  var hasGSAP=typeof window.gsap!=="undefined";

  var yr=document.getElementById("yr");
  if(yr){yr.textContent=String(new Date().getFullYear());}

  /* ── mobile navigation drawer ─────────────────────────── */
  var toggle=document.getElementById("navToggle");
  var drawer=document.getElementById("navDrawer");
  if(toggle&&drawer){
    var lastFocus=null;
    var setDrawer=function(open){
      toggle.setAttribute("aria-expanded",open?"true":"false");
      drawer.setAttribute("data-open",open?"true":"false");
      drawer.setAttribute("aria-hidden",open?"false":"true");
      root.classList.toggle("is-locked",open);
      if(open){
        lastFocus=document.activeElement;
        var first=drawer.querySelector("a,button");
        if(first){first.focus();}
      }else if(lastFocus&&lastFocus.focus){
        lastFocus.focus();
      }
    };
    toggle.addEventListener("click",function(){
      setDrawer(toggle.getAttribute("aria-expanded")!=="true");
    });
    drawer.addEventListener("click",function(e){
      if(e.target.closest("a")){setDrawer(false);}
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){setDrawer(false);}
    });
    /* keep focus inside the open drawer */
    drawer.addEventListener("keydown",function(e){
      if(e.key!=="Tab"){return;}
      var items=[].slice.call(drawer.querySelectorAll("a,button"))
        .filter(function(el){return el.offsetParent!==null;});
      if(!items.length){return;}
      var first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
    /* a resize up to desktop leaves no orphaned lock */
    window.addEventListener("resize",function(){
      if(window.innerWidth>980&&toggle.getAttribute("aria-expanded")==="true"){setDrawer(false);}
    });
  }

  /* ── directory search ─────────────────────────────────── */
  var find=document.getElementById("findInput");
  var grid=document.getElementById("findGrid");
  if(find&&grid){
    var cards=[].slice.call(grid.children);
    var count=document.getElementById("findCount");
    var none=document.getElementById("findNone");
    var total=cards.length;
    var apply=function(){
      var q=find.value.trim().toLowerCase();
      var shown=0;
      cards.forEach(function(c){
        var hit=!q||(c.textContent||"").toLowerCase().indexOf(q)!==-1;
        c.hidden=!hit;
        if(hit){shown++;}
      });
      if(count){count.textContent=shown===total?(total+" listings"):(shown+" of "+total);}
      if(none){none.hidden=shown!==0;}
    };
    find.addEventListener("input",apply);
    find.addEventListener("search",apply);
    apply();
  }

  /* ── showcase rail controls ───────────────────────────── */
  [].slice.call(document.querySelectorAll(".railwrap")).forEach(function(wrap){
    var rail=wrap.querySelector(".rail");
    var prev=wrap.querySelector("[data-rail='prev']");
    var next=wrap.querySelector("[data-rail='next']");
    if(!rail||!prev||!next){return;}
    var step=function(){
      var card=rail.firstElementChild;
      if(!card){return rail.clientWidth;}
      var gap=parseFloat(getComputedStyle(rail).columnGap||"0")||0;
      return card.getBoundingClientRect().width+gap;
    };
    var sync=function(){
      var max=rail.scrollWidth-rail.clientWidth-1;
      prev.disabled=rail.scrollLeft<=0;
      next.disabled=rail.scrollLeft>=max;
    };
    prev.addEventListener("click",function(){rail.scrollLeft-=step();});
    next.addEventListener("click",function(){rail.scrollLeft+=step();});
    rail.addEventListener("scroll",sync,{passive:true});
    window.addEventListener("resize",sync);
    sync();
  });

  /* ── back to top ──────────────────────────────────────── */
  var totop=document.getElementById("toTop");
  if(totop){
    var onScroll=function(){
      totop.setAttribute("data-show",window.scrollY>600?"true":"false");
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    totop.addEventListener("click",function(){
      window.scrollTo({top:0,behavior:reduced?"auto":"smooth"});
    });
    onScroll();
  }

  /* ── nav scrollspy (homepage) ─────────────────────────── */
  var spyLinks=[].slice.call(document.querySelectorAll('.navlinks a[href^="#"]'));
  if(spyLinks.length&&"IntersectionObserver" in window){
    var byId={};
    var targets=[];
    spyLinks.forEach(function(a){
      var id=a.getAttribute("href").slice(1);
      var el=id&&document.getElementById(id);
      if(el){byId[id]=a;targets.push(el);}
    });
    if(targets.length){
      var spy=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting){return;}
          spyLinks.forEach(function(a){a.classList.remove("is-active");});
          var a=byId[en.target.id];
          if(a){a.classList.add("is-active");}
        });
      },{rootMargin:"-45% 0px -50% 0px"});
      targets.forEach(function(t){spy.observe(t);});
    }
  }

  /* ── ecosystem index: one generative panel per house ── */
  var rows=[].slice.call(document.querySelectorAll("#ecoList .eco__row"));
  var stage=document.getElementById("ecoStage");
  var panels=[];
  if(rows.length&&stage){
    rows.forEach(function(row,i){
      var accent=row.style.getPropertyValue("--row-accent").trim()||"#F08FB4";
      var nameEl=row.querySelector(".eco__name");
      var p=document.createElement("div");
      p.className="eco__panel"+(i===0?" is-on":"");
      p.style.background=
        "radial-gradient(64% 50% at "+(22+(i%3)*26)+"% "+(20+(i%4)*18)+"%,"+accent+"BF,transparent 70%),"+
        "radial-gradient(54% 44% at "+(78-(i%3)*22)+"% "+(74-(i%2)*16)+"%,rgba(62,99,200,.45),transparent 72%),"+
        "linear-gradient("+(140+i*9)+"deg,#132149,#060D20)";
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

  /* ── pink dollar cursor ───────────────────────────────── */
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

  /* ── newsletter: real validation, no fake success ─────── */
  var form=document.getElementById("signup");
  if(form){
    var field=document.getElementById("emailField");
    var note=document.getElementById("signupNote");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      if(!field||!note){return;}
      var v=field.value.trim();
      var ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      note.classList.toggle("is-err",!ok);
      field.setAttribute("aria-invalid",ok?"false":"true");
      if(!v){note.textContent="Enter an email address.";}
      else if(!ok){note.textContent="That address does not look right.";}
      else{note.textContent="Address accepted — connect the live list endpoint to store it.";}
    });
    if(field){
      field.addEventListener("input",function(){
        field.setAttribute("aria-invalid","false");
        if(note){note.classList.remove("is-err");note.textContent="";}
      });
    }
  }

  if(reduced||!hasGSAP){return;}
  gsap.registerPlugin(window.ScrollTrigger);

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

  var track=document.getElementById("bandTrack");
  if(track){
    gsap.fromTo(track,{xPercent:0},{xPercent:-50,ease:"none",
      scrollTrigger:{trigger:".band",start:"top bottom",end:"bottom top",scrub:.6}});
  }

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


(function(){
"use strict";

var KEY="knobelzocker_club_edition_1_1";
var LEGACY_KEY="knobelzocker_tournament_v12";
var LEGACY_KEY="knobelzocker_tournament_v8";
var COLORS=["#6ec5ff","#ff9c9c","#ffd36e","#8fe3b0","#c7a5ff","#ffb870","#8fdde7","#f58ec8","#b8d77b","#9eb7ff","#63c7a6","#e7a6d7"];
var DEFAULT_RULES="1. Es nehmen mindestens zwei und höchstens zwölf Spieler teil.\n\n2. Das Zeitfenster des Turniers wird vor dem Turnierstart festgelegt.\n\n3. Nach jeder Runde werden alle Verlierer ausgewählt.\n\n4. Spieler, die eine Runde aussetzen, zählen in dieser Runde ebenfalls als Verlierer.\n\n5. Jeder Spieler kann pro Runde höchstens einmal als Verlierer gewertet werden.\n\n6. Gewinner ist am Ende des festgelegten Zeitfensters der Spieler mit den wenigsten verlorenen Runden.\n\n7. Bei gleicher Anzahl verlorener Runden spielen die Erstplatzierten den Sieger aus.";
var state={profiles:[],tournament:null,archive:[],rules:DEFAULT_RULES};
var selected={};

function E(id){return document.getElementById(id)}
function today(){
  var d=new Date();
  var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return y+"-"+m+"-"+day;
}
function formatDate(value){
  if(!value)return "–";
  var parts=value.split("-");
  return parts.length===3?parts[2]+"."+parts[1]+"."+parts[0]:value;
}
function clone(obj){return JSON.parse(JSON.stringify(obj))}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function load(){
  try{
    var raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY);
    if(!raw) raw=localStorage.getItem(LEGACY_KEY);
    if(raw){
      var parsed=JSON.parse(raw);
      if(parsed && Array.isArray(parsed.profiles)){
        state.profiles=parsed.profiles;
        state.tournament=parsed.tournament||null;
        state.archive=Array.isArray(parsed.archive)?parsed.archive:[]; state.rules=typeof parsed.rules==="string"?parsed.rules:DEFAULT_RULES;
      }
    }
  }catch(e){}
}
function showMessage(text){E("formMessage").textContent=text||""}
function positionMenu(menu,button){
  var margin=16;
  var rect=button.getBoundingClientRect();

  menu.style.visibility="hidden";
  menu.classList.remove("hidden");

  var menuWidth=Math.min(menu.offsetWidth,window.innerWidth-margin*2);
  var menuHeight=Math.min(menu.scrollHeight,window.innerHeight-margin*2);

  var left=rect.left;
  if(left+menuWidth>window.innerWidth-margin){
    left=window.innerWidth-margin-menuWidth;
  }
  left=Math.max(margin,left);

  var spaceBelow=window.innerHeight-rect.bottom-margin;
  var spaceAbove=rect.top-margin;
  var top;

  if(spaceBelow>=Math.min(menuHeight,420)||spaceBelow>=spaceAbove){
    top=Math.min(rect.bottom+8,window.innerHeight-margin-menuHeight);
  }else{
    top=Math.max(margin,rect.top-8-menuHeight);
  }

  menu.style.left=Math.round(left)+"px";
  menu.style.top=Math.round(Math.max(margin,top))+"px";
  menu.style.visibility="visible";
}

function closeMenus(except){
  ["profileMenu","rulesMenu","archiveMenu","statsMenu"].forEach(function(id){
    if(id!==except){
      var menu=E(id);
      menu.classList.add("hidden");
      menu.style.removeProperty("left");
      menu.style.removeProperty("top");
      menu.style.removeProperty("visibility");
    }
  });
  if(!except)document.body.classList.remove("menu-open");
}
function toggleMenu(id,button){
  var menu=E(id);
  var opening=menu.classList.contains("hidden");
  if(!opening){
    closeMenus();
    return;
  }
  closeMenus(id);
  positionMenu(menu,button);
  document.body.classList.add("menu-open");
}
function repositionOpenMenu(){
  [
    ["profileMenu","profileMenuBtn"],
    ["rulesMenu","rulesBtn"],
    ["archiveMenu","archiveBtn"],
    ["statsMenu","statsBtn"]
  ].forEach(function(pair){
    var menu=E(pair[0]);
    if(!menu.classList.contains("hidden"))positionMenu(menu,E(pair[1]));
  });
}

function addProfile(){
  var input=E("newName");
  var name=input.value.trim();
  if(!name){showMessage("Bitte einen Namen eingeben.");input.focus();return}
  if(state.profiles.length>=12){showMessage("Maximal 12 Spielerprofile sind möglich.");return}
  for(var i=0;i<state.profiles.length;i++){
    if(state.profiles[i].name.toLowerCase()===name.toLowerCase()){
      showMessage("Dieses Profil gibt es bereits.");return
    }
  }
  state.profiles.push({name:name,active:true,color:COLORS[state.profiles.length%COLORS.length]});
  input.value="";
  showMessage("");
  save();
  renderProfiles();
  input.focus();
}

function renderProfiles(){
  var grid=E("profileGrid");
  grid.innerHTML="";
  if(!state.profiles.length){
    grid.innerHTML='<div class="empty">Noch keine Spielerprofile angelegt.</div>';
    return;
  }
  state.profiles.forEach(function(profile,index){
    var card=document.createElement("div");
    card.className="profile-card "+(profile.active?"active":"inactive");
    card.style.background=profile.color;

    var del=document.createElement("button");
    del.type="button";
    del.className="delete-profile";
    del.textContent="×";
    del.title="Profil löschen";
    del.addEventListener("click",function(ev){
      ev.stopPropagation();
      if(confirm("Profil wirklich löschen?")){
        state.profiles.splice(index,1);
        save();renderProfiles();
      }
    });

    var span=document.createElement("span");
    span.textContent=profile.name;
    card.appendChild(del);
    card.appendChild(span);
    card.addEventListener("click",function(ev){
      ev.stopPropagation();
      state.profiles[index].active=!state.profiles[index].active;
      save();renderProfiles();
    });
    grid.appendChild(card);
  });
}

function startTournament(){
  var active=state.profiles.filter(function(p){return p.active});
  var tournamentType=E("tournamentType").value;
  var tournamentName=tournamentType==="Sonstiges"?E("customTournamentName").value.trim():tournamentType;
  var date=E("tournamentDate").value||today();
  var startTime=E("tournamentStartTime").value;
  var lastRoundTime=E("lastRoundStartTime").value;
  if(active.length<2){alert("Bitte mindestens zwei Spieler auswählen.");return}
  if(!tournamentName){alert("Bitte einen Turniernamen eingeben.");return}
  if(!startTime){alert("Bitte die Anfangszeit festlegen.");return}
  if(!lastRoundTime){alert("Bitte den spätesten Beginn der letzten Spielrunde festlegen.");return}
  if(lastRoundTime<=startTime){alert("Der späteste Beginn der letzten Spielrunde muss nach der Anfangszeit liegen.");return}
  if(state.tournament && !confirm("Das laufende Turnier wird ersetzt. Fortfahren?"))return;

  var losses={},players=[];
  active.forEach(function(p){
    players.push({name:p.name,color:p.color});
    losses[p.name]=0;
  });
  state.tournament={
    id:"t"+Date.now(),
    type:tournamentType,
    name:tournamentName,
    date:date,
    startTime:startTime,
    lastRoundTime:lastRoundTime,
    players:players,
    losses:losses,
    rounds:[],
    status:"active",
    finishedAt:null
  };
  selected={};
  save();
  closeMenus();
  renderAll();
}

function buildLossDisplay(count){
  count=Number(count||0);
  var wrap=document.createElement("span");
  wrap.className="dice-losses";

  if(count<=0){
    var zero=document.createElement("strong");
    zero.className="zero-loss";
    zero.textContent="0";
    wrap.appendChild(zero);
    return wrap;
  }

  function addDie(){
    var die=document.createElement("span");
    die.className="mini-die";
    die.setAttribute("aria-hidden","true");
    die.innerHTML="<i></i><i></i><i></i>";
    wrap.appendChild(die);
  }

  if(count<=5){
    for(var i=0;i<count;i++) addDie();
  }else{
    addDie();
    var times=document.createElement("strong");
    times.className="loss-times";
    times.textContent="× "+count;
    wrap.appendChild(times);
  }
  return wrap;
}

function profileTint(hex,alpha){
  if(!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "rgba(214,169,40,"+alpha+")";
  var r=parseInt(hex.slice(1,3),16);
  var g=parseInt(hex.slice(3,5),16);
  var b=parseInt(hex.slice(5,7),16);
  return "rgba("+r+","+g+","+b+","+alpha+")";
}

function renderGame(){
  var title=E("roundTitle");
  var headerTournamentName=E("headerTournamentName");
  var headerRound=E("headerRound");
  var headerDate=E("headerDate");
  var headerStartTime=E("headerStartTime");
  var headerLastRoundTime=E("headerLastRoundTime");
  var grid=E("playersGrid");

  grid.innerHTML="";

  if(!state.tournament){
    title.textContent="Noch kein Turnier gestartet";
    headerTournamentName.textContent="–";
    headerRound.textContent="–";
    headerDate.textContent="–";
    headerStartTime.textContent="–";
    headerLastRoundTime.textContent="–";
    E("status").textContent="Öffne die Turnierdaten und wähle mindestens zwei Teilnehmer aus.";
    grid.className="players-grid";
    return;
  }

  var t=state.tournament;
  var round=t.rounds.length+1;

  title.textContent="Runde "+round+" – Verlierer auswählen";
  headerTournamentName.textContent=t.name||"–";
  headerRound.textContent=String(round);
  headerDate.textContent=formatDate(t.date);
  headerStartTime.textContent=t.startTime||"–";
  headerLastRoundTime.textContent=t.lastRoundTime||"–";

  grid.className="players-grid players-"+t.players.length;
  var chosen=[];

  t.players.forEach(function(player){
    var btn=document.createElement("button");
    btn.type="button";
    btn.className="player-card"+(selected[player.name]?" selected":"");
    btn.style.setProperty("--profile-bg",profileTint(player.color,.16));

    var mark=document.createElement("span");
    mark.className="profile-mark";
    mark.style.background=player.color||"#d6a928";

    var name=document.createElement("span");
    name.className="player-name";
    name.textContent=player.name;

    var losses=document.createElement("span");
    losses.className="loss-view";
    losses.appendChild(buildLossDisplay(t.losses[player.name]||0));

    btn.appendChild(mark);
    btn.appendChild(name);
    btn.appendChild(losses);

    btn.addEventListener("click",function(){
      selected[player.name]=!selected[player.name];
      renderGame();
    });

    grid.appendChild(btn);
    if(selected[player.name]) chosen.push(player.name);
  });

  E("status").textContent=chosen.length
    ? "Ausgewählt: "+chosen.join(", ")
    : "Verlierer und Aussetzer anklicken.";
}

function sortedPlayers(tournament){
  return tournament.players.slice().sort(function(a,b){
    var diff=tournament.losses[a.name]-tournament.losses[b.name];
    return diff!==0?diff:a.name.localeCompare(b.name,"de");
  });
}
function renderRanking(){
  var body=E("rankingBody");
  body.innerHTML="";

  if(!state.tournament){
    body.innerHTML='<div class="empty">Noch kein Turnier gestartet.</div>';
    return;
  }

  sortedPlayers(state.tournament).forEach(function(player,index){
    var card=document.createElement("div");
    card.className="ranking-card";
    card.style.setProperty("--profile-bg",profileTint(player.color,.16));

    var place=document.createElement("span");
    place.className="ranking-place";
    if(index===0) place.textContent="🥇";
    else if(index===1) place.textContent="🥈";
    else if(index===2) place.textContent="🥉";
    else place.textContent=String(index+1)+".";

    var mark=document.createElement("span");
    mark.className="profile-mark ranking-profile-mark";
    mark.style.background=player.color||"#d6a928";

    var name=document.createElement("span");
    name.className="player-name ranking-name";
    name.textContent=player.name;

    var losses=document.createElement("span");
    losses.className="loss-view ranking-losses";
    losses.appendChild(buildLossDisplay(state.tournament.losses[player.name]||0));

    card.appendChild(place);
    card.appendChild(mark);
    card.appendChild(name);
    card.appendChild(losses);
    body.appendChild(card);
  });
}

function renderHistory(){
  var list=E("historyList");
  list.innerHTML="";

  if(!state.tournament || !state.tournament.rounds.length){
    list.innerHTML='<div class="empty">Noch keine Runde gespeichert.</div>';
    return;
  }

  var rounds=state.tournament.rounds;
  var from=Math.max(0,rounds.length-3);

  for(var index=from;index<rounds.length;index++){
    var round=rounds[index];
    var item=document.createElement("div");
    item.className="history-item history-card-row";

    var left=document.createElement("strong");
    left.className="history-round-label";
    left.textContent="Runde "+(index+1);

    var right=document.createElement("span");
    right.className="history-player-list";

    if(round.length){
      round.forEach(function(playerName){
        var player=state.tournament.players.find(function(p){return p.name===playerName});

        var chip=document.createElement("span");
        chip.className="history-player-card";
        chip.style.setProperty("--profile-bg",profileTint(player?player.color:"#999",.16));

        var mark=document.createElement("span");
        mark.className="history-profile-mark";
        mark.style.background=player?player.color:"#999";

        var text=document.createElement("span");
        text.className="player-name history-player-name";
        text.textContent=playerName;

        chip.appendChild(mark);
        chip.appendChild(text);
        right.appendChild(chip);
      });
    }else{
      right.textContent="Keine Verlierer";
    }

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  }
}

function nextRound(){
  if(!state.tournament){alert("Bitte zuerst ein Turnier starten.");return}
  var losers=[];
  Object.keys(selected).forEach(function(name){if(selected[name])losers.push(name)});
  if(!losers.length && !confirm("Keine Verlierer ausgewählt. Runde trotzdem speichern?"))return;
  losers.forEach(function(name){state.tournament.losses[name]++});
  state.tournament.rounds.push(losers);
  selected={};
  save();renderAll();
}

function undo(){
  if(!state.tournament || !state.tournament.rounds.length)return;
  var last=state.tournament.rounds.pop();
  last.forEach(function(name){state.tournament.losses[name]--});
  selected={};
  save();renderAll();
}

function endTournament(){
  if(!state.tournament)return;
  if(!confirm("Turnier beenden und in der Historie speichern?"))return;
  var archived=clone(state.tournament);
  archived.status="finished";
  archived.finishedAt=new Date().toISOString();
  state.archive.unshift(archived);
  state.tournament=null;
  selected={};
  save();renderAll();
  positionMenu(E("archiveMenu"),E("archiveBtn"));
  document.body.classList.add("menu-open");
}

function resumeTournament(index){
  if(state.tournament && !confirm("Das aktuelle Turnier wird ersetzt. Fortfahren?"))return;
  var restored=clone(state.archive[index]);
  restored.status="active";
  restored.finishedAt=null;
  state.tournament=restored;
  state.archive.splice(index,1);
  selected={};
  save();closeMenus();renderAll();
}

function deleteArchived(index){
  if(!confirm("Dieses Turnier endgültig aus der Historie löschen?"))return;
  state.archive.splice(index,1);
  save();renderArchive();
}

function renderArchive(){
  var list=E("archiveList");
  list.innerHTML="";
  if(!state.archive.length){
    list.innerHTML='<div class="empty">Noch keine beendeten Turniere vorhanden.</div>';
    return;
  }
  state.archive.forEach(function(t,index){
    var sorted=sortedPlayers(t);
    var min=sorted.length?t.losses[sorted[0].name]:0;
    var winners=sorted.filter(function(p){return t.losses[p.name]===min}).map(function(p){return p.name});
    var card=document.createElement("div");
    card.className="archive-card";

    var head=document.createElement("div");
    head.className="archive-head";
    var info=document.createElement("div");
    var title=document.createElement("div");
    title.className="archive-title";
    title.textContent=(t.name||"Turnier")+" · "+formatDate(t.date)+" · "+t.rounds.length+" Runden";
    var meta=document.createElement("div");
    meta.className="archive-meta";
    meta.textContent="Sieger: "+winners.join(", ")+" · "+t.players.length+" Spieler · Beginn "+(t.startTime||"–")+" · letzte Runde spätestens "+(t.lastRoundTime||"–");
    info.appendChild(title);info.appendChild(meta);
    head.appendChild(info);

    var actions=document.createElement("div");
    actions.className="archive-actions";
    var resume=document.createElement("button");
    resume.type="button";resume.className="primary";resume.textContent="Weiterspielen";
    resume.addEventListener("click",function(){resumeTournament(index)});
    var remove=document.createElement("button");
    remove.type="button";remove.className="danger";remove.textContent="Löschen";
    remove.addEventListener("click",function(){deleteArchived(index)});
    actions.appendChild(resume);actions.appendChild(remove);

    card.appendChild(head);card.appendChild(actions);list.appendChild(card);
  });
}

function tournamentDateTime(dateValue,timeValue){
  if(!dateValue||!timeValue)return null;
  var dateParts=dateValue.split("-").map(Number);
  var timeParts=timeValue.split(":").map(Number);
  return new Date(dateParts[0],dateParts[1]-1,dateParts[2],timeParts[0],timeParts[1],0,0);
}
function formatDuration(milliseconds){
  var totalMinutes=Math.max(0,Math.ceil(milliseconds/60000));
  var hours=Math.floor(totalMinutes/60);
  var minutes=totalMinutes%60;
  if(hours&&minutes)return hours+" Std. "+minutes+" Min.";
  if(hours)return hours+" Std.";
  return minutes+" Min.";
}
function updateTournamentClock(){
  var now=new Date();
  E("clockNow").textContent=now.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  var t=state.tournament;
  var clock=E("tournamentClock"),progress=E("clockProgress"),message=E("clockMessage");
  progress.className="clock-progress";
  message.className="clock-message";
  if(!t){
    clock.classList.add("inactive");
    E("clockWindow").textContent="–";
    E("clockRemaining").textContent="–";
    progress.style.width="0%";
    message.textContent="Noch kein Turnier gestartet.";
    return;
  }
  clock.classList.remove("inactive");
  E("clockWindow").textContent=(t.startTime||"–")+" – "+(t.lastRoundTime||"–");
  var start=tournamentDateTime(t.date,t.startTime);
  var end=tournamentDateTime(t.date,t.lastRoundTime);
  if(!start||!end||end<=start){
    E("clockRemaining").textContent="–";
    progress.style.width="0%";
    message.textContent="Das Zeitfenster ist nicht vollständig festgelegt.";
    return;
  }
  var total=end-start,elapsed=now-start;
  var percent=Math.max(0,Math.min(100,elapsed/total*100));
  progress.style.width=percent+"%";
  if(now<start){
    E("clockRemaining").textContent="Start in "+formatDuration(start-now);
    message.textContent="Das Turnier hat noch nicht begonnen.";
  }else if(now>=end){
    E("clockRemaining").textContent="Zeitfenster beendet";
    progress.classList.add("over");message.classList.add("over");
    message.textContent="Zeitfenster beendet – jetzt die letzte Spielrunde beginnen bzw. abschließen.";
  }else{
    E("clockRemaining").textContent=formatDuration(end-now);
    if(percent>=90){
      progress.classList.add("urgent");message.classList.add("urgent");
      message.textContent="Achtung: Die letzte Spielrunde muss sehr bald beginnen.";
    }else if(percent>=75){
      progress.classList.add("warning");message.classList.add("warning");
      message.textContent="Das Turnier geht in die Schlussphase.";
    }else{
      message.textContent="Das Turnier läuft innerhalb des festgelegten Zeitfensters.";
    }
  }
}
function tournamentTypeForStats(t){
  if(t.type)return t.type;
  if(t.name==="Knobelabend"||t.name==="Knobelmarathon")return t.name;
  return "Sonstiges";
}
function renderStatistics(){
  var selectedType=E("statsType").value;
  var tournaments=state.archive.filter(function(t){
    return selectedType==="Alle"||tournamentTypeForStats(t)===selectedType;
  });
  var totalRounds=tournaments.reduce(function(sum,t){return sum+(Array.isArray(t.rounds)?t.rounds.length:0)},0);
  var participants={};
  tournaments.forEach(function(t){(t.players||[]).forEach(function(p){participants[p.name]=true})});
  var summary=[
    ["Turniere",tournaments.length],
    ["Runden",totalRounds],
    ["Spieler",Object.keys(participants).length],
    ["Ø Runden",tournaments.length?(totalRounds/tournaments.length).toFixed(1).replace(".",","):"0,0"]
  ];
  E("statsSummary").innerHTML=summary.map(function(item){
    return '<div class="stat-card"><span>'+item[0]+'</span><strong>'+item[1]+'</strong></div>';
  }).join("");
  var playerStats={};
  tournaments.forEach(function(t){
    var sorted=sortedPlayers(t);
    var minimum=sorted.length?t.losses[sorted[0].name]:null;
    (t.players||[]).forEach(function(player){
      if(!playerStats[player.name]){
        playerStats[player.name]={name:player.name,color:player.color,tournaments:0,wins:0,losses:0};
      }
      var stat=playerStats[player.name];
      stat.tournaments++;
      stat.losses+=Number(t.losses[player.name]||0);
      if(minimum!==null&&Number(t.losses[player.name])===minimum)stat.wins++;
    });
  });
  var body=E("statsBody");body.innerHTML="";
  var rows=Object.keys(playerStats).map(function(name){return playerStats[name]}).sort(function(a,b){
    return b.wins-a.wins||(a.losses/a.tournaments)-(b.losses/b.tournaments)||a.name.localeCompare(b.name,"de");
  });
  if(!rows.length){
    body.innerHTML='<tr><td colspan="4">Für diese Auswahl liegen noch keine abgeschlossenen Turniere vor.</td></tr>';
    return;
  }
  rows.forEach(function(stat){
    var row=document.createElement("tr");
    var name=document.createElement("td");
    var dot=document.createElement("span");
    dot.style.cssText="display:inline-block;width:13px;height:13px;border-radius:50%;margin-right:7px;background:"+(stat.color||"#999");
    name.appendChild(dot);name.appendChild(document.createTextNode(stat.name));
    var tournamentsCell=document.createElement("td");tournamentsCell.textContent=stat.tournaments;
    var wins=document.createElement("td");wins.textContent=stat.wins;
    var average=document.createElement("td");average.textContent=(stat.losses/stat.tournaments).toFixed(1).replace(".",",");
    row.appendChild(name);row.appendChild(tournamentsCell);row.appendChild(wins);row.appendChild(average);body.appendChild(row);
  });
}
function renderRules(){
  E("rulesEditor").value=state.rules||DEFAULT_RULES;
}

function renderAll(){
  renderProfiles();renderGame();renderRanking();renderHistory();renderArchive();renderRules();renderStatistics();updateTournamentClock();
}

window.addEventListener("DOMContentLoaded",function(){
  load();
  E("tournamentDate").value=today();
  E("tournamentType").value="Knobelabend";
  E("customTournamentRow").classList.add("hidden");
  E("tournamentStartTime").value="19:00";
  E("lastRoundStartTime").value="23:00";
  E("tournamentType").addEventListener("change",function(){
    E("customTournamentRow").classList.toggle("hidden",E("tournamentType").value!=="Sonstiges");
  });

  E("profileMenuBtn").addEventListener("click",function(ev){ev.stopPropagation();toggleMenu("profileMenu",E("profileMenuBtn"))});
  E("rulesBtn").addEventListener("click",function(ev){ev.stopPropagation();toggleMenu("rulesMenu",E("rulesBtn"))});
  E("archiveBtn").addEventListener("click",function(ev){ev.stopPropagation();toggleMenu("archiveMenu",E("archiveBtn"))});
  E("statsBtn").addEventListener("click",function(ev){ev.stopPropagation();toggleMenu("statsMenu",E("statsBtn"))});

  ["profileMenu","rulesMenu","archiveMenu","statsMenu"].forEach(function(id){
    E(id).addEventListener("click",function(ev){ev.stopPropagation()});
  });
  E("closeProfileMenuBtn").addEventListener("click",function(){closeMenus()});
  E("closeRulesMenuBtn").addEventListener("click",function(){closeMenus()});
  E("closeArchiveMenuBtn").addEventListener("click",function(){closeMenus()});
  E("closeStatsMenuBtn").addEventListener("click",function(){closeMenus()});
  E("statsType").addEventListener("change",renderStatistics);

  E("saveRulesBtn").addEventListener("click",function(){
    var text=E("rulesEditor").value.trim();
    if(!text){alert("Die Turnierregeln dürfen nicht leer sein.");return}
    state.rules=text;
    save();
    alert("Die Turnierregeln wurden gespeichert.");
  });
  E("resetRulesBtn").addEventListener("click",function(){
    if(confirm("Standardregeln wiederherstellen?")){
      state.rules=DEFAULT_RULES;
      save();
      renderRules();
    }
  });

  E("profileForm").addEventListener("submit",function(ev){ev.preventDefault();addProfile()});
  E("startTournamentBtn").addEventListener("click",startTournament);
  E("startMainBtn").addEventListener("click",function(){
    if(state.tournament){
      nextRound();
      return;
    }
    if(!state.profiles.length){
      closeMenus("profileMenu");
      positionMenu(E("profileMenu"),E("profileMenuBtn"));
      document.body.classList.add("menu-open");
      E("newName").focus();
    }else{
      startTournament();
    }
  });
  E("allBtn").addEventListener("click",function(){
    state.profiles.forEach(function(p){p.active=true});save();renderProfiles();
  });
  E("noneBtn").addEventListener("click",function(){
    state.profiles.forEach(function(p){p.active=false});save();renderProfiles();
  });
  E("resetBtn").addEventListener("click",function(){
    if(confirm("Alle Profile, das laufende Turnier und die Historie wirklich löschen?")){
      state={profiles:[],tournament:null,archive:[],rules:DEFAULT_RULES};
      selected={};save();renderAll();
    }
  });
  E("nextRoundBtn").addEventListener("click",nextRound);
  E("undoBtn").addEventListener("click",undo);
  E("endBtn").addEventListener("click",endTournament);
  E("showFullHistoryBtn").addEventListener("click",function(ev){ev.stopPropagation();toggleMenu("archiveMenu",E("archiveBtn"))});

  document.addEventListener("click",function(ev){
    if(!ev.target.closest(".dropdown"))closeMenus();
  });
  window.addEventListener("resize",repositionOpenMenu);

  renderAll();
  window.setInterval(updateTournamentClock,1000);
  if(!state.profiles.length){
    positionMenu(E("profileMenu"),E("profileMenuBtn"));
    document.body.classList.add("menu-open");
  }
});
})();

let deferredInstallPrompt=null;

function isIOSDevice(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandaloneMode(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
function showInstallGuidance(){
  if(isStandaloneMode())return;
  const hint=document.getElementById("installHint");
  const text=document.getElementById("installHintText");
  if(!hint||!text)return;
  text.textContent=isIOSDevice()
    ? "In Safari: Teilen antippen und „Zum Home-Bildschirm“ wählen."
    : "Über „App installieren“ kannst du die Club Edition wie ein normales Programm hinzufügen.";
  hint.classList.remove("hidden");
}
function setupPWA(){
  if("serviceWorker" in navigator && location.protocol!=="file:"){
    window.addEventListener("load",()=>{
      navigator.serviceWorker.register("./service-worker.js").catch(console.error);
    });
  }

  const installButton=document.getElementById("installAppBtn");
  const closeHint=document.getElementById("closeInstallHintBtn");

  if(closeHint)closeHint.addEventListener("click",()=>document.getElementById("installHint").classList.add("hidden"));

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    if(installButton)installButton.classList.remove("hidden");
    showInstallGuidance();
  });

  if(installButton){
    installButton.addEventListener("click",async()=>{
      if(deferredInstallPrompt){
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt=null;
        installButton.classList.add("hidden");
        document.getElementById("installHint").classList.add("hidden");
      }else{
        showInstallGuidance();
      }
    });
  }

  window.addEventListener("appinstalled",()=>{
    deferredInstallPrompt=null;
    if(installButton)installButton.classList.add("hidden");
    const hint=document.getElementById("installHint");
    if(hint)hint.classList.add("hidden");
  });

  if(isIOSDevice()&&!isStandaloneMode())setTimeout(showInstallGuidance,900);
}
window.addEventListener("DOMContentLoaded",setupPWA);

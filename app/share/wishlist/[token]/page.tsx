"use client";
/**
 * Clarityboards — Public Wishlist Share View
 * File: app/share/wishlist/[token]/page.tsx
 *
 * No login required. Family/friends can:
 *  - View all items on the list with photos + prices
 *  - Mark an item as "I'll get this!" (sets purchased_by)
 *  - See which items are already claimed
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Wishlist {
  id: string; name: string; list_type: string;
  description: string | null; color: string;
}
interface WishItem {
  id: string; title: string; url: string | null;
  cover_image: string | null; price: number | null;
  target_price: number | null; notes: string | null;
  priority: string; status: string; purchased_by: string | null;
}

const T = {
  cream:'#FAF9F7', ivory:'#FFFEF9', sand:'#F2EDE6',
  border:'#EDE9E3', muted:'#C8B8A8', sub:'#9C8B7A',
  ink:'#2C2318', purple:'#9B6B9E', purpleLight:'#F5EDF6',
  serif:"'Cormorant Garamond',Georgia,serif",
  sans:"'DM Sans',system-ui,sans-serif",
};

const LIST_TYPES: Record<string,{emoji:string;label:string}> = {
  birthday: {emoji:'🎂',label:'Birthday Wish List'},
  christmas:{emoji:'🎄',label:'Christmas Wish List'},
  registry: {emoji:'💍',label:'Registry'},
  grocery:  {emoji:'🛒',label:'Grocery Wish List'},
  home:     {emoji:'🏠',label:'Home Wish List'},
  general:  {emoji:'✦', label:'Wish List'},
};
const PRIORITY_EMOJI: Record<string,string> = { high:'🔴', medium:'🟡', low:'🟢' };

export default function PublicWishlistPage() {
  const params = useParams();
  const token  = params?.token as string;
  const [list,setList]   = useState<Wishlist|null>(null);
  const [items,setItems] = useState<WishItem[]>([]);
  const [loading,setLoading]     = useState(true);
  const [notFound,setNotFound]   = useState(false);
  const [claimModal,setClaimModal] = useState<WishItem|null>(null);
  const [claimedItems,setClaimedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    fetch(`/api/wishlist?action=by-token&token=${token}`)
      .then(r=>r.json())
      .then(d => {
        if (d.error) { setNotFound(true); }
        else { setList(d.list); setItems(d.items??[]); }
        setLoading(false);
      })
      .catch(()=>{ setNotFound(true); setLoading(false); });
  }, [token]);

  const claimItem = async (item:WishItem, name:string) => {
    await fetch(`/api/wishlist?action=item&id=${item.id}`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:'purchased',purchased_by:name}),
    });
    setItems(prev=>prev.map(i=>i.id===item.id?{...i,status:'purchased',purchased_by:name}:i));
    setClaimedItems(prev=>new Set([...prev,item.id]));
    setClaimModal(null);
  };

  const lt = list ? (LIST_TYPES[list.list_type]??LIST_TYPES.general) : null;
  const wantItems      = items.filter(i=>i.status==='want');
  const purchasedItems = items.filter(i=>i.status!=='want');

  if (loading) return (
    <div style={{fontFamily:T.sans,minHeight:'100vh',background:T.cream,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:T.serif,fontSize:22,color:T.sub,fontStyle:'italic'}}>Loading…</div>
    </div>
  );

  if (notFound) return (
    <div style={{fontFamily:T.sans,minHeight:'100vh',background:T.cream,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>✦</div>
        <div style={{fontFamily:T.serif,fontSize:26,color:T.ink,fontWeight:500,marginBottom:8}}>List not found</div>
        <div style={{fontSize:14,color:T.sub}}>This list may be private or the link may have changed.</div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.sans,minHeight:'100vh',background:T.cream}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        *{box-sizing:border-box;}
        .ic:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(44,35,24,0.12)!important;}
      `}</style>

      {/* Header */}
      <div style={{background:T.ink,padding:'28px 20px 24px'}}>
        <div style={{maxWidth:720,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:42,marginBottom:10}}>{lt?.emoji}</div>
          <div style={{fontFamily:T.serif,fontSize:30,color:'white',fontWeight:500,marginBottom:6}}>{list?.name}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.55)'}}>
            {lt?.label} · {wantItems.length} item{wantItems.length!==1?'s':''} available
          </div>
          {list?.description && (
            <div style={{fontSize:13,color:'rgba(255,255,255,0.65)',fontStyle:'italic',marginTop:8}}>{list.description}</div>
          )}
        </div>
      </div>

      {/* How it works banner */}
      <div style={{background:T.purpleLight,borderBottom:'1px solid #D9C8DC',padding:'12px 20px',textAlign:'center'}}>
        <div style={{fontSize:12,color:T.purple,fontWeight:600}}>
          🎁 See something you'd like to give? Tap <strong>"I'll get this!"</strong> to claim it — so no one buys duplicates.
        </div>
      </div>

      <div style={{maxWidth:720,margin:'0 auto',padding:'28px 20px 80px'}}>

        {items.length===0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <div style={{fontFamily:T.serif,fontSize:22,color:T.sub,fontStyle:'italic'}}>No items on this list yet</div>
          </div>
        )}

        {/* Available items */}
        {wantItems.length>0 && (
          <>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>
              Available · {wantItems.length} {wantItems.length===1?'item':'items'}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:32}}>
              {wantItems.map(item=>(
                <PublicItemCard key={item.id} item={item} onClaim={()=>setClaimModal(item)} justClaimed={claimedItems.has(item.id)}/>
              ))}
            </div>
          </>
        )}

        {/* Already claimed */}
        {purchasedItems.length>0 && (
          <>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
              Already claimed
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
              {purchasedItems.map(item=>(
                <PublicItemCard key={item.id} item={item} onClaim={()=>{}} justClaimed={false} claimed/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Powered by footer */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderTop:'1px solid #EDE9E3',padding:'10px 20px',textAlign:'center'}}>
        <div style={{fontSize:11,color:T.muted}}>
          Made with <span style={{color:T.purple,fontWeight:700}}>Clarityboards</span> · <a href="/" style={{color:T.purple,fontWeight:600,textDecoration:'none'}}>Create your own wish list →</a>
        </div>
      </div>

      {claimModal && (
        <ClaimModal item={claimModal} onClaim={claimItem} onClose={()=>setClaimModal(null)}/>
      )}
    </div>
  );
}

function PublicItemCard({item,onClaim,justClaimed,claimed=false}:{item:WishItem;onClaim:()=>void;justClaimed:boolean;claimed?:boolean}) {
  return (
    <div className="ic" style={{borderRadius:12,background:T.ivory,border:'1px solid #EDE9E3',overflow:'hidden',boxShadow:'0 1px 6px rgba(44,35,24,0.06)',transition:'transform 0.2s,box-shadow 0.2s',opacity:claimed?0.55:1}}>
      {item.cover_image ? (
        <div style={{height:150,overflow:'hidden',position:'relative'}}>
          <img src={item.cover_image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).parentElement!.style.display='none';}}/>
          {item.price && <div style={{position:'absolute',bottom:7,left:7,background:'rgba(255,255,255,0.92)',borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:700,color:T.ink}}>${item.price.toFixed(2)}</div>}
          {claimed && <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{background:'white',borderRadius:20,padding:'4px 14px',fontSize:11,fontWeight:700,color:T.sub}}>✓ Claimed{item.purchased_by?` by ${item.purchased_by}`:''}</div></div>}
        </div>
      ) : (
        <div style={{height:4,background:T.purple}}/>
      )}
      <div style={{padding:'11px 13px 14px'}}>
        <div style={{fontSize:12,fontWeight:600,color:claimed?T.muted:T.ink,lineHeight:1.35,marginBottom:4,textDecoration:claimed?'line-through':'none'}}>{item.title}</div>
        {!item.cover_image && item.price && <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>${item.price.toFixed(2)}</div>}
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10}}>{PRIORITY_EMOJI[item.priority]} {item.priority} priority</span>
        </div>
        {item.notes && <div style={{fontSize:11,color:T.sub,fontStyle:'italic',marginBottom:8,lineHeight:1.5}}>{item.notes}</div>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer"
            style={{display:'block',fontSize:11,color:T.purple,fontWeight:600,textDecoration:'none',marginBottom:8}}>
            View product ↗
          </a>
        )}
        {claimed ? (
          <div style={{fontSize:11,color:T.sub,fontWeight:600}}>✓ {item.purchased_by?`Claimed by ${item.purchased_by}`:'Already claimed'}</div>
        ) : justClaimed ? (
          <div style={{fontSize:11,color:'#5C8B6A',fontWeight:700}}>🎉 Claimed — thank you!</div>
        ) : (
          <button onClick={onClaim}
            style={{width:'100%',padding:'8px',borderRadius:8,border:'none',background:T.purple,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans}}>
            🎁 I'll get this!
          </button>
        )}
      </div>
    </div>
  );
}

function ClaimModal({item,onClaim,onClose}:{item:WishItem;onClaim:(item:WishItem,name:string)=>void;onClose:()=>void}) {
  const [name,setName] = useState('');
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(44,35,24,0.55)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:T.ivory,width:'100%',maxWidth:480,borderRadius:'20px 20px 0 0',padding:'10px 24px 44px'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 20px'}}/>
        {item.cover_image && (
          <div style={{height:120,borderRadius:12,overflow:'hidden',marginBottom:18}}>
            <img src={item.cover_image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          </div>
        )}
        <div style={{fontFamily:T.serif,fontSize:22,color:T.ink,fontWeight:500,marginBottom:4}}>{item.title}</div>
        {item.price && <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:16}}>${item.price.toFixed(2)}</div>}
        <div style={{fontSize:13,color:T.sub,marginBottom:18,lineHeight:1.6}}>
          Enter your name so the list owner knows this item is taken — and no one buys a duplicate.
        </div>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Your Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&onClaim(item,name.trim())}
          placeholder="e.g. Aunt Sarah" autoFocus
          style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid #EDE9E3',fontSize:14,fontFamily:T.sans,color:T.ink,outline:'none',background:'white',marginBottom:18}}/>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'12px',borderRadius:12,border:'1px solid #EDE9E3',background:'transparent',color:T.sub,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:T.sans}}>Cancel</button>
          <button onClick={()=>name.trim()&&onClaim(item,name.trim())} disabled={!name.trim()}
            style={{flex:2,padding:'13px',borderRadius:12,border:'none',background:name.trim()?T.purple:'#EDE9E3',color:name.trim()?'white':T.muted,fontWeight:700,fontSize:14,cursor:name.trim()?'pointer':'not-allowed',fontFamily:T.sans}}>
            🎁 Claim this gift
          </button>
        </div>
      </div>
    </div>
  );
}

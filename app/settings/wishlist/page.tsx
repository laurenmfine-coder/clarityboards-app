"use client";
/**
 * Clarityboards — WishlistBoard (v3 — Editorial Retail Redesign)
 * File: app/settings/wishlist/page.tsx
 *
 * Aesthetic: Loft / Lou Grey editorial retail — warm ivory, thin serifs,
 * clean SVG icons, generous whitespace, refined product grid.
 * No emojis. Professional, shoppable, shareable.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────
interface Wishlist {
  id: string; user_id: string; name: string;
  list_type: ListType; description: string | null;
  share_token: string; is_public: boolean; color: string;
  created_at: string;
}
interface WishItem {
  id: string; wishlist_id: string; title: string;
  url: string | null; cover_image: string | null;
  price: number | null; price_checked_at: string | null;
  target_price: number | null; notes: string | null;
  priority: Priority; status: ItemStatus;
  purchased_by: string | null; watch_id: string | null;
}
type ListType   = 'birthday'|'holiday'|'registry'|'grocery'|'home'|'custom'|'general';
type Priority   = 'high'|'medium'|'low';
type ItemStatus = 'want'|'purchased'|'received';

// ── Design System ──────────────────────────────────────────
const C = {
  bg:       '#FAFAF8',
  surface:  '#FFFFFF',
  warm:     '#F5F2EE',
  border:   '#E8E4DF',
  borderSoft:'#F0EDE8',
  ink:      '#1A1714',
  inkMid:   '#5C5650',
  inkLight: '#9C968F',
  accent:   '#8B6B52',      // warm cognac — the one color
  accentBg: '#F7F0EB',
  success:  '#3D6B52',
  successBg:'#EDF5F0',
  serif:    "'Cormorant Garamond', 'Georgia', serif",
  sans:     "'DM Sans', system-ui, sans-serif",
  mono:     "'DM Mono', monospace",
};

// ── SVG Icon set (no emojis) ───────────────────────────────
const Icon = {
  cake:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C12 2 10 5 10 7a2 2 0 004 0c0-2-2-5-2-5z"/><rect x="3" y="9" width="18" height="13" rx="1"/><path d="M3 14h18M7 9V8M12 9V8M17 9V8"/></svg>,
  holiday:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L8 9h8l-4-6z"/><path d="M9.5 9L6 15h12l-3.5-6"/><path d="M7 15l-2 5h14l-2-5"/><line x1="12" y1="3" x2="12" y2="1"/></svg>,
  ring:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="14" r="7"/><path d="M9 14h6M12 11v6"/><path d="M8 7l1.5-3h5L16 7"/></svg>,
  cart:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  home:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  tag:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  star:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  share:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  eye:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  arrow:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>,
  x:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  copy:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  lock:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  unlock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>,
};

const LIST_TYPES: Record<ListType,{icon:React.ReactNode;label:string;color:string;sub:string}> = {
  birthday: {icon:Icon.cake,    label:'Birthday',  color:'#8B6B52', sub:'Share with family & friends'},
  holiday:  {icon:Icon.holiday, label:'Holiday',   color:'#3D6B52', sub:'Track who bought what'},
  registry: {icon:Icon.ring,    label:'Registry',  color:'#6B528B', sub:'Wedding, baby & graduation'},
  grocery:  {icon:Icon.cart,    label:'Grocery',   color:'#52788B', sub:'Specialty & pantry items'},
  home:     {icon:Icon.home,    label:'Home',      color:'#8B7852', sub:'Furniture, decor & more'},
  custom:   {icon:Icon.tag,     label:'Custom',    color:'#52628B', sub:'Your own category'},
  general:  {icon:Icon.star,    label:'General',   color:'#5C5650', sub:'Anything you want'},
};

const PRIORITY_CONFIG: Record<Priority,{label:string;dot:string}> = {
  high:   {label:'High priority',   dot:'#C0392B'},
  medium: {label:'Medium priority', dot:'#E67E22'},
  low:    {label:'Low priority',    dot:'#27AE60'},
};

const STATUS_CONFIG: Record<ItemStatus,{label:string;bg:string;text:string}> = {
  want:      {label:'Want',      bg:C.accentBg,   text:C.accent},
  purchased: {label:'Purchased', bg:C.successBg,  text:C.success},
  received:  {label:'Received',  bg:'#F0EDE8',    text:C.inkMid},
};

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function WishlistBoardPage() {
  const router = useRouter();
  const [lists, setLists]           = useState<Wishlist[]>([]);
  const [activeList, setActiveList] = useState<Wishlist|null>(null);
  const [items, setItems]           = useState<WishItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAddList, setShowAddList]   = useState(false);
  const [showAddItem, setShowAddItem]   = useState(false);
  const [detailItem, setDetailItem]     = useState<WishItem|null>(null);
  const [shareModal, setShareModal]     = useState<Wishlist|null>(null);
  const [copied, setCopied]             = useState(false);

  useEffect(() => { loadLists(); }, []);

  const hdrs = async () => {
    const {data:{session}} = await supabase.auth.getSession();
    return {Authorization:`Bearer ${session?.access_token??''}`, 'Content-Type':'application/json'};
  };
  const api = async (method:string, path:string, body?:object) => {
    const h = await hdrs();
    return fetch(path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  };

  const loadLists = async () => {
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const r = await api('GET','/api/wishlist?action=lists');
    const d = await r.json();
    setLists(d.lists??[]);
    setLoading(false);
  };
  const openList = async (list:Wishlist) => {
    setActiveList(list);
    const r = await api('GET',`/api/wishlist?action=items&listId=${list.id}`);
    const d = await r.json();
    setItems(d.items??[]);
  };
  const createList = async (data:Partial<Wishlist>) => {
    const r = await api('POST','/api/wishlist?action=list',data);
    const d = await r.json();
    if (d.list) { setLists(prev=>[d.list,...prev]); setShowAddList(false); openList(d.list); }
  };
  const updateList = async (id:string, data:Partial<Wishlist>) => {
    await api('PATCH',`/api/wishlist?action=list&id=${id}`,data);
    setLists(prev=>prev.map(l=>l.id===id?{...l,...data}:l));
    if (activeList?.id===id) setActiveList(prev=>prev?{...prev,...data}:prev);
  };
  const deleteList = async (id:string) => {
    await api('DELETE',`/api/wishlist?action=list&id=${id}`);
    setLists(prev=>prev.filter(l=>l.id!==id));
    setActiveList(null); setItems([]);
  };
  const addItem = async (data:Partial<WishItem>) => {
    const r = await api('POST','/api/wishlist?action=item',{...data,wishlist_id:activeList?.id});
    const d = await r.json();
    if (d.item) setItems(prev=>[...prev,d.item]);
    setShowAddItem(false);
  };
  const updateItem = async (id:string, data:Partial<WishItem>) => {
    await api('PATCH',`/api/wishlist?action=item&id=${id}`,data);
    setItems(prev=>prev.map(i=>i.id===id?{...i,...data}:i));
    if (detailItem?.id===id) setDetailItem(prev=>prev?{...prev,...data}:prev);
  };
  const deleteItem = async (id:string) => {
    await api('DELETE',`/api/wishlist?action=item&id=${id}`);
    setItems(prev=>prev.filter(i=>i.id!==id));
    setDetailItem(null);
  };
  const toggleShare = async (list:Wishlist) => {
    const r = await api('POST',`/api/wishlist?action=share&id=${list.id}`,{is_public:!list.is_public});
    const d = await r.json();
    if (d.list) { setLists(prev=>prev.map(l=>l.id===list.id?d.list:l)); setShareModal(d.list); }
  };
  const shareUrl = (list:Wishlist) =>
    typeof window!=='undefined' ? `${window.location.origin}/share/wishlist/${list.share_token}` : '';
  const copyUrl = (list:Wishlist) => {
    navigator.clipboard.writeText(shareUrl(list));
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const wantItems      = items.filter(i=>i.status==='want');
  const purchasedItems = items.filter(i=>i.status!=='want');
  const lt = activeList ? LIST_TYPES[activeList.list_type] : null;

  return (
    <div style={{fontFamily:C.sans,minHeight:'100vh',background:C.bg,color:C.ink}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        .item-card{transition:box-shadow 0.2s,transform 0.2s;}
        .item-card:hover{box-shadow:0 4px 20px rgba(26,23,20,0.10)!important;transform:translateY(-1px);}
        .list-row:hover{background:#FDFCFA!important;}
        .btn-ghost:hover{background:${C.warm}!important;}
        .btn-accent:hover{background:#7A5A42!important;}
        input:focus,textarea:focus{border-color:${C.accent}!important;outline:none;}
        .pill-select:hover{border-color:${C.ink}!important;}
        .pill-select.active{background:${C.ink}!important;color:white!important;border-color:${C.ink}!important;}
      `}</style>

      {/* ── Top navigation bar ── */}
      <header style={{borderBottom:`1px solid ${C.border}`,background:C.surface,position:'sticky',top:0,zIndex:40}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',gap:16}}>
          <button onClick={()=>{if(activeList){setActiveList(null);setItems([]);}else router.push('/dashboard');}}
            style={{display:'flex',alignItems:'center',gap:6,color:C.inkMid,background:'none',border:'none',cursor:'pointer',fontFamily:C.sans,fontSize:13,padding:'4px 0'}}>
            <span style={{color:C.inkLight}}>{Icon.back}</span>
            <span>{activeList?'All Lists':'Dashboard'}</span>
          </button>

          <div style={{width:1,height:20,background:C.border}}/>

          <div style={{flex:1}}>
            {activeList ? (
              <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                <span style={{fontFamily:C.serif,fontSize:20,fontWeight:400,letterSpacing:'0.01em'}}>{activeList.name}</span>
                {activeList.is_public && (
                  <span style={{fontSize:11,color:C.success,fontWeight:500,letterSpacing:'0.04em',textTransform:'uppercase'}}>Shared</span>
                )}
              </div>
            ) : (
              <span style={{fontFamily:C.serif,fontSize:20,fontWeight:400,letterSpacing:'0.01em'}}>Wish Lists</span>
            )}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {activeList && (
              <button onClick={()=>setShareModal(activeList)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:4,border:`1px solid ${C.border}`,background:C.surface,color:C.inkMid,fontFamily:C.sans,fontSize:12,fontWeight:500,cursor:'pointer',letterSpacing:'0.03em',transition:'background 0.15s'}}
                className="btn-ghost">
                {Icon.share} Share
              </button>
            )}
            <button onClick={()=>activeList?setShowAddItem(true):setShowAddList(true)}
              style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:4,border:'none',background:C.ink,color:'white',fontFamily:C.sans,fontSize:12,fontWeight:500,cursor:'pointer',letterSpacing:'0.03em',transition:'background 0.15s'}}
              className="btn-accent">
              {Icon.plus} {activeList?'Add Item':'New List'}
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1100,margin:'0 auto',padding:'40px 24px 100px'}}>

        {/* ── LIST VIEW ── */}
        {!activeList && (
          <>
            {loading ? (
              <div style={{textAlign:'center',padding:'80px 0',color:C.inkLight,fontFamily:C.serif,fontSize:20,fontStyle:'italic'}}>Loading…</div>
            ) : lists.length===0 ? (
              <EmptyLists onAdd={()=>setShowAddList(true)}/>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:32}}>
                  <div>
                    <h1 style={{fontFamily:C.serif,fontSize:36,fontWeight:300,letterSpacing:'0.01em',margin:0,lineHeight:1.1}}>Your Wish Lists</h1>
                    <p style={{color:C.inkLight,fontSize:13,margin:'6px 0 0',fontWeight:300}}>{lists.length} {lists.length===1?'list':'lists'}</p>
                  </div>
                </div>

                {/* Lists as clean rows */}
                <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.surface}}>
                  {lists.map((list,i)=>{
                    const lt = LIST_TYPES[list.list_type];
                    return (
                      <div key={list.id} className="list-row" onClick={()=>openList(list)}
                        style={{display:'flex',alignItems:'center',gap:16,padding:'18px 24px',borderBottom:i<lists.length-1?`1px solid ${C.borderSoft}`:'none',cursor:'pointer',transition:'background 0.15s'}}>
                        <div style={{width:36,height:36,borderRadius:4,background:C.warm,display:'flex',alignItems:'center',justifyContent:'center',color:lt.color,flexShrink:0}}>
                          {lt.icon}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:C.serif,fontSize:18,fontWeight:400,letterSpacing:'0.01em',marginBottom:2}}>{list.name}</div>
                          <div style={{fontSize:12,color:C.inkLight,fontWeight:300}}>{lt.label}{list.description?` · ${list.description}`:''}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                          {list.is_public && (
                            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.success,fontWeight:500}}>
                              {Icon.unlock} <span>Shared</span>
                            </div>
                          )}
                          <button onClick={e=>{e.stopPropagation();setShareModal(list);}}
                            style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',border:`1px solid ${C.border}`,borderRadius:4,background:'transparent',color:C.inkMid,fontSize:11,cursor:'pointer',fontFamily:C.sans,transition:'background 0.15s'}}
                            className="btn-ghost">
                            {Icon.share}
                          </button>
                          <span style={{color:C.inkLight}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={()=>setShowAddList(true)}
                  style={{marginTop:12,width:'100%',padding:'14px',border:`1px dashed ${C.border}`,borderRadius:8,background:'transparent',color:C.inkLight,fontFamily:C.serif,fontSize:15,fontStyle:'italic',fontWeight:300,cursor:'pointer',transition:'all 0.15s',letterSpacing:'0.01em'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.accent;(e.currentTarget as HTMLButtonElement).style.color=C.accent;}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;(e.currentTarget as HTMLButtonElement).style.color=C.inkLight;}}>
                  + Create a new list
                </button>
              </>
            )}
          </>
        )}

        {/* ── ITEMS VIEW ── */}
        {activeList && (
          <>
            {/* List header */}
            <div style={{marginBottom:36}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16}}>
                <div style={{width:48,height:48,borderRadius:6,background:C.warm,display:'flex',alignItems:'center',justifyContent:'center',color:lt?.color??C.accent,flexShrink:0,marginTop:2}}>
                  <span style={{transform:'scale(1.2)'}}>{lt?.icon}</span>
                </div>
                <div style={{flex:1}}>
                  <h1 style={{fontFamily:C.serif,fontSize:34,fontWeight:300,letterSpacing:'0.01em',margin:'0 0 4px',lineHeight:1.1}}>{activeList.name}</h1>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:12,color:C.inkLight,fontWeight:300}}>{lt?.label}</span>
                    {activeList.description && <><span style={{color:C.border}}>·</span><span style={{fontSize:12,color:C.inkLight,fontWeight:300}}>{activeList.description}</span></>}
                    <span style={{color:C.border}}>·</span>
                    <span style={{fontSize:12,color:C.inkLight,fontWeight:300}}>{items.length} {items.length===1?'item':'items'}</span>
                  </div>
                </div>
              </div>

              {/* URL import hint bar */}
              <div style={{padding:'12px 16px',background:C.warm,borderRadius:6,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
                <span style={{color:C.accent}}>{Icon.tag}</span>
                <span style={{fontSize:12,color:C.inkMid,fontWeight:300}}>
                  Paste any product URL from <strong style={{fontWeight:500}}>Loft, White House Black Market, Nordstrom, Amazon, Etsy</strong> — photo, name and price import automatically. Price tracking starts immediately.
                </span>
                <button onClick={()=>setShowAddItem(true)}
                  style={{marginLeft:'auto',padding:'6px 14px',borderRadius:4,border:'none',background:C.ink,color:'white',fontSize:12,fontFamily:C.sans,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                  Add Item
                </button>
              </div>
            </div>

            {/* Item grid */}
            {items.length===0 ? (
              <EmptyItems listType={activeList.list_type} onAdd={()=>setShowAddItem(true)}/>
            ) : (
              <>
                {wantItems.length>0 && (
                  <div style={{marginBottom:48}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
                      <span style={{fontSize:11,fontWeight:500,color:C.inkLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>Available</span>
                      <span style={{fontSize:11,color:C.inkLight,fontWeight:300}}>({wantItems.length})</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:1,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
                      {wantItems.map(item=><WishItemCard key={item.id} item={item} onClick={()=>setDetailItem(item)}/>)}
                    </div>
                  </div>
                )}
                {purchasedItems.length>0 && (
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                      <span style={{fontSize:11,fontWeight:500,color:C.inkLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>Purchased / Received</span>
                      <span style={{fontSize:11,color:C.inkLight,fontWeight:300}}>({purchasedItems.length})</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:1,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
                      {purchasedItems.map(item=><WishItemCard key={item.id} item={item} onClick={()=>setDetailItem(item)}/>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showAddList && <AddListModal onSave={createList} onClose={()=>setShowAddList(false)}/>}
      {showAddItem && activeList && <AddItemModal listId={activeList.id} onSave={addItem} onClose={()=>setShowAddItem(false)}/>}
      {detailItem  && <ItemDetailModal item={detailItem} onUpdate={u=>updateItem(detailItem.id,u)} onDelete={()=>deleteItem(detailItem.id)} onClose={()=>setDetailItem(null)}/>}
      {shareModal  && <ShareModal list={shareModal} url={shareUrl(shareModal)} copied={copied} onCopy={()=>copyUrl(shareModal)} onToggle={()=>toggleShare(shareModal)} onClose={()=>setShareModal(null)}/>}
    </div>
  );
}

// ── Item Card — retail grid style ──────────────────────────
function WishItemCard({item,onClick}:{item:WishItem;onClick:()=>void}) {
  const s = STATUS_CONFIG[item.status];
  const p = PRIORITY_CONFIG[item.priority];
  const isDone = item.status!=='want';
  return (
    <div className="item-card" onClick={onClick}
      style={{background:C.surface,cursor:'pointer',position:'relative',boxShadow:'none',transition:'box-shadow 0.2s,transform 0.2s'}}>
      {/* Product image */}
      <div style={{aspectRatio:'3/4',background:C.warm,overflow:'hidden',position:'relative'}}>
        {item.cover_image ? (
          <img src={item.cover_image} alt={item.title}
            style={{width:'100%',height:'100%',objectFit:'cover',opacity:isDone?0.5:1,transition:'opacity 0.2s'}}
            onError={e=>{(e.target as HTMLImageElement).parentElement!.style.background=C.warm;(e.target as HTMLImageElement).style.display='none';}}/>
        ) : (
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:C.border}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
          </div>
        )}
        {/* Priority dot */}
        <div style={{position:'absolute',top:10,left:10,width:7,height:7,borderRadius:'50%',background:p.dot,boxShadow:'0 0 0 2px white'}}/>
        {/* Watch badge */}
        {item.watch_id && (
          <div style={{position:'absolute',top:10,right:10,background:'rgba(26,23,20,0.75)',backdropFilter:'blur(4px)',borderRadius:3,padding:'3px 6px',display:'flex',alignItems:'center',gap:3,color:'white'}}>
            <span style={{opacity:0.8}}>{Icon.eye}</span>
          </div>
        )}
        {/* Status overlay for purchased */}
        {isDone && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.3)'}}>
            <div style={{background:'white',borderRadius:3,padding:'5px 10px',fontSize:10,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:C.inkMid,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              {s.label}
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      <div style={{padding:'12px 14px 16px'}}>
        <div style={{fontSize:13,fontWeight:400,color:isDone?C.inkLight:C.ink,lineHeight:1.4,marginBottom:6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{item.title}</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {item.price ? (
            <span style={{fontFamily:C.serif,fontSize:16,fontWeight:400,color:isDone?C.inkLight:C.ink}}>${item.price.toFixed(2)}</span>
          ) : <span/>}
          {item.target_price && item.price && item.price<=item.target_price && (
            <span style={{fontSize:10,fontWeight:500,color:C.success,letterSpacing:'0.04em'}}>AT TARGET</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty States ───────────────────────────────────────────
function EmptyLists({onAdd}:{onAdd:()=>void}) {
  return (
    <div style={{maxWidth:600,margin:'80px auto',textAlign:'center'}}>
      <div style={{width:56,height:56,borderRadius:8,background:C.warm,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',color:C.inkMid}}>
        {Icon.star}
      </div>
      <h1 style={{fontFamily:C.serif,fontSize:36,fontWeight:300,letterSpacing:'0.01em',margin:'0 0 12px',lineHeight:1.1}}>Your wish lists</h1>
      <p style={{color:C.inkMid,fontSize:14,lineHeight:1.7,margin:'0 0 40px',fontWeight:300}}>
        Create lists for every occasion — birthday, holiday, registry, or home.<br/>
        Paste any product URL and the photo, price, and price watch set up automatically.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',marginBottom:32,background:C.border}}>
        {Object.entries(LIST_TYPES).map(([key,lt])=>(
          <div key={key} style={{background:C.surface,padding:'20px 16px'}}>
            <div style={{color:lt.color,marginBottom:10}}>{lt.icon}</div>
            <div style={{fontFamily:C.serif,fontSize:15,fontWeight:400,marginBottom:3,letterSpacing:'0.01em'}}>{lt.label}</div>
            <div style={{fontSize:11,color:C.inkLight,fontWeight:300,lineHeight:1.4}}>{lt.sub}</div>
          </div>
        ))}
      </div>
      <button onClick={onAdd}
        style={{padding:'12px 28px',borderRadius:4,border:'none',background:C.ink,color:'white',fontFamily:C.sans,fontWeight:500,fontSize:13,cursor:'pointer',letterSpacing:'0.03em'}}>
        Create your first list
      </button>
    </div>
  );
}

function EmptyItems({listType,onAdd}:{listType:ListType;onAdd:()=>void}) {
  const lt = LIST_TYPES[listType];
  const eg: Record<ListType,string[]> = {
    birthday:['Loft dress','WHBM blazer','Amazon Echo'],
    holiday: ['AirPods','Le Creuset pot','Cashmere throw'],
    registry:['KitchenAid mixer','Pottery Barn duvet','Cuisinart set'],
    grocery: ['Truffle oil','Specialty cheese','Matcha powder'],
    home:    ['CB2 lamp','Article sofa','West Elm rug'],
    custom:  ['Anything you want','Any product URL','Price tracked automatically'],
    general: ['Anything you want','Any product URL','Price tracked automatically'],
  };
  return (
    <div style={{textAlign:'center',padding:'64px 0'}}>
      <div style={{width:48,height:48,borderRadius:6,background:C.warm,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',color:lt.color}}>
        {lt.icon}
      </div>
      <div style={{fontFamily:C.serif,fontSize:26,fontWeight:300,letterSpacing:'0.01em',marginBottom:8}}>Nothing here yet</div>
      <div style={{fontSize:13,color:C.inkMid,lineHeight:1.7,marginBottom:6,fontWeight:300}}>
        Paste any product URL — photo, name and price import automatically.
      </div>
      <div style={{fontSize:12,color:C.inkLight,marginBottom:28,fontWeight:300}}>{eg[listType].join(' · ')}</div>
      <button onClick={onAdd}
        style={{padding:'10px 24px',borderRadius:4,border:`1px solid ${C.ink}`,background:'transparent',color:C.ink,fontFamily:C.sans,fontWeight:500,fontSize:12,cursor:'pointer',letterSpacing:'0.03em'}}>
        Add your first item
      </button>
    </div>
  );
}

// ── Add List Modal ─────────────────────────────────────────
function AddListModal({onSave,onClose}:{onSave:(d:Partial<Wishlist>)=>void;onClose:()=>void}) {
  const [name,setName]   = useState('');
  const [type,setType]   = useState<ListType>('birthday');
  const [desc,setDesc]   = useState('');

  const handleType = (t:ListType) => {
    setType(t);
    if (!name || Object.values(LIST_TYPES).some(lt=>lt.label+' Wish List'===name||lt.label===name))
      setName(LIST_TYPES[t].label+' Wish List');
  };

  return (
    <Sheet onClose={onClose} title="Create a Wish List">
      <FL>List Type</FL>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
        {(Object.entries(LIST_TYPES) as [ListType,any][]).map(([key,lt])=>(
          <button key={key} onClick={()=>handleType(key)}
            style={{padding:'12px 8px',borderRadius:6,border:`1px solid ${type===key?C.ink:C.border}`,background:type===key?C.ink:'transparent',cursor:'pointer',textAlign:'center',fontFamily:C.sans,transition:'all 0.15s'}}>
            <div style={{color:type===key?'white':lt.color,display:'flex',justifyContent:'center',marginBottom:6}}>{lt.icon}</div>
            <div style={{fontSize:11,fontWeight:500,color:type===key?'white':C.ink,letterSpacing:'0.02em'}}>{lt.label}</div>
          </button>
        ))}
      </div>
      <FL>List Name</FL>
      <FInput value={name} onChange={e=>setName(e.target.value)} placeholder={`e.g. ${LIST_TYPES[type].label} 2026`}/>
      <FL>Description (optional)</FL>
      <FInput value={desc} onChange={e=>setDesc(e.target.value)} placeholder="For family to reference…"/>
      <div style={{display:'flex',gap:10,marginTop:4}}>
        <FBtnGhost onClick={onClose}>Cancel</FBtnGhost>
        <FBtnPrimary onClick={()=>{if(!name.trim())return;onSave({name,list_type:type,description:desc||null,color:LIST_TYPES[type].color});}} disabled={!name.trim()}>
          Create List
        </FBtnPrimary>
      </div>
    </Sheet>
  );
}

// ── Add Item Modal ─────────────────────────────────────────
function AddItemModal({listId,onSave,onClose}:{listId:string;onSave:(d:Partial<WishItem>)=>void;onClose:()=>void}) {
  const [url,setUrl]         = useState('');
  const [title,setTitle]     = useState('');
  const [price,setPrice]     = useState('');
  const [target,setTarget]   = useState('');
  const [priority,setPriority] = useState<Priority>('medium');
  const [notes,setNotes]     = useState('');
  const [cover,setCover]     = useState('');
  const [fetchSt,setFetchSt] = useState('');
  const [fetching,setFetching] = useState(false);

  const fetchProduct = async (raw:string) => {
    if (!raw.trim()) return;
    setFetching(true); setFetchSt('Importing product…');
    try {
      const r = await fetch('/api/wishlist?action=fetch-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:raw.trim()})});
      const d = await r.json();
      if (d.title&&!title) setTitle(d.title);
      if (d.image) setCover(d.image);
      if (d.price&&!price) setPrice(String(d.price));
      const parts = [d.title?'Name':'',d.image?'Photo':'',d.price?'Price':''].filter(Boolean);
      setFetchSt(parts.length ? `Imported: ${parts.join(', ')}` : 'No product data found — fill in manually');
    } catch { setFetchSt('Could not fetch URL'); }
    setFetching(false);
  };

  return (
    <Sheet onClose={onClose} title="Add to List">
      <FL>Product URL</FL>
      <FInput value={url} onChange={e=>setUrl(e.target.value)} onBlur={e=>fetchProduct(e.target.value)}
        placeholder="Paste from Loft, WHBM, Nordstrom, Amazon, Etsy…"/>
      {fetchSt && (
        <div style={{fontSize:11,color:fetchSt.startsWith('Imported')?C.success:C.inkLight,marginBottom:12,fontWeight:300}}>
          {fetchSt.startsWith('Imported')?<span style={{marginRight:4,display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}>{Icon.check}</span>:null}
          {fetchSt}
        </div>
      )}
      {cover && (
        <div style={{width:'100%',height:180,borderRadius:6,overflow:'hidden',marginBottom:16,background:C.warm,position:'relative'}}>
          <img src={cover} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}
            onError={e=>{(e.target as HTMLImageElement).parentElement!.style.display='none';}}/>
          <div style={{position:'absolute',top:8,right:8,background:'rgba(26,23,20,0.6)',borderRadius:3,padding:'3px 8px',fontSize:10,color:'white',fontWeight:500,letterSpacing:'0.04em'}}>
            PHOTO IMPORTED
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <FL>Item Name</FL>
          <FInput value={title} onChange={e=>setTitle(e.target.value)} placeholder="Product name"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <FL>Price</FL>
            <FInput value={price} onChange={e=>setPrice(e.target.value)} placeholder="59.99" type="number"/>
          </div>
          <div>
            <FL>Alert at</FL>
            <FInput value={target} onChange={e=>setTarget(e.target.value)} placeholder="44.99" type="number"/>
          </div>
        </div>
      </div>
      {(price||target) && (
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.inkLight,marginBottom:12,marginTop:-4}}>
          {Icon.alert} Price watch activates automatically
        </div>
      )}
      <FL>Priority</FL>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {(['high','medium','low'] as Priority[]).map(p=>(
          <button key={p} onClick={()=>setPriority(p)} className={`pill-select${priority===p?' active':''}`}
            style={{flex:1,padding:'8px',borderRadius:4,border:`1px solid ${priority===p?C.ink:C.border}`,background:priority===p?C.ink:'transparent',cursor:'pointer',fontFamily:C.sans,fontSize:12,fontWeight:500,color:priority===p?'white':C.inkMid,transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:priority===p?'white':PRIORITY_CONFIG[p].dot,flexShrink:0}}/>
            {PRIORITY_CONFIG[p].label.replace(' priority','')}
          </button>
        ))}
      </div>
      <FL>Notes (optional)</FL>
      <FInput value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Size, color, variant…"/>
      <div style={{display:'flex',gap:10,marginTop:4}}>
        <FBtnGhost onClick={onClose}>Cancel</FBtnGhost>
        <FBtnPrimary onClick={()=>{if(!title.trim())return;onSave({title,url:url||null,cover_image:cover||null,price:price?parseFloat(price):null,target_price:target?parseFloat(target):null,priority,notes:notes||null,status:'want'});}} disabled={!title.trim()||fetching}>
          {fetching?'Importing…':'Add to List'}
        </FBtnPrimary>
      </div>
    </Sheet>
  );
}

// ── Item Detail Modal ──────────────────────────────────────
function ItemDetailModal({item,onUpdate,onDelete,onClose}:{item:WishItem;onUpdate:(u:Partial<WishItem>)=>void;onDelete:()=>void;onClose:()=>void}) {
  const [confirmDel,setConfirmDel] = useState(false);
  const [purchasedBy,setPurchasedBy] = useState(item.purchased_by??'');
  const s = STATUS_CONFIG[item.status];
  return (
    <Sheet onClose={onClose} title={item.title} wide>
      <div style={{display:'flex',gap:20,marginBottom:24}}>
        {item.cover_image && (
          <div style={{width:140,height:180,borderRadius:6,overflow:'hidden',flexShrink:0,background:C.warm}}>
            <img src={item.cover_image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          </div>
        )}
        <div style={{flex:1}}>
          {(item.price||item.target_price) && (
            <div style={{display:'flex',gap:20,marginBottom:16,padding:'14px 16px',background:C.warm,borderRadius:6}}>
              {item.price && <div><div style={{fontSize:10,fontWeight:500,color:C.inkLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Current</div><div style={{fontFamily:C.serif,fontSize:24,fontWeight:300}}>${item.price.toFixed(2)}</div></div>}
              {item.target_price && <div><div style={{fontSize:10,fontWeight:500,color:C.inkLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Target</div><div style={{fontFamily:C.serif,fontSize:24,fontWeight:300,color:item.price&&item.price<=item.target_price?C.success:C.ink}}>${item.target_price.toFixed(2)}</div></div>}
            </div>
          )}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color:C.accent,fontWeight:500,textDecoration:'none'}}>{Icon.arrow} View product</a>}
            {item.watch_id && <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:C.inkLight}}>{Icon.eye} Price watched</span>}
          </div>
          {item.notes && <div style={{fontSize:13,color:C.inkMid,lineHeight:1.6,fontWeight:300,fontStyle:'italic'}}>{item.notes}</div>}
        </div>
      </div>

      <FL>Status</FL>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {(['want','purchased','received'] as ItemStatus[]).map(st=>(
          <button key={st} onClick={()=>onUpdate({status:st})} className={`pill-select${item.status===st?' active':''}`}
            style={{flex:1,padding:'9px',borderRadius:4,border:`1px solid ${item.status===st?C.ink:C.border}`,background:item.status===st?C.ink:'transparent',cursor:'pointer',fontFamily:C.sans,fontSize:12,fontWeight:500,color:item.status===st?'white':C.inkMid,transition:'all 0.15s'}}>
            {STATUS_CONFIG[st].label}
          </button>
        ))}
      </div>

      {item.status==='purchased' && (
        <div style={{marginBottom:20}}>
          <FL>Purchased by</FL>
          <div style={{display:'flex',gap:8}}>
            <FInput value={purchasedBy} onChange={e=>setPurchasedBy(e.target.value)} placeholder="Name (shown on shared list)" noMargin/>
            <button onClick={()=>onUpdate({purchased_by:purchasedBy||null})}
              style={{padding:'10px 16px',borderRadius:4,border:'none',background:C.ink,color:'white',fontFamily:C.sans,fontWeight:500,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}>Save</button>
          </div>
        </div>
      )}

      <div style={{borderTop:`1px solid ${C.borderSoft}`,paddingTop:16,marginTop:4}}>
        {confirmDel ? (
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <span style={{fontSize:12,color:C.inkMid,flex:1,fontWeight:300}}>Remove this item from the list?</span>
            <button onClick={()=>setConfirmDel(false)} style={{padding:'8px 16px',borderRadius:4,border:`1px solid ${C.border}`,background:'transparent',color:C.inkMid,fontFamily:C.sans,fontSize:12,cursor:'pointer'}}>Keep</button>
            <button onClick={onDelete} style={{padding:'8px 16px',borderRadius:4,border:'none',background:'#C0392B',color:'white',fontFamily:C.sans,fontSize:12,fontWeight:500,cursor:'pointer'}}>Remove</button>
          </div>
        ) : (
          <button onClick={()=>setConfirmDel(true)} style={{display:'flex',alignItems:'center',gap:6,color:C.inkLight,background:'none',border:'none',cursor:'pointer',fontFamily:C.sans,fontSize:12,padding:0}}>
            {Icon.trash} Remove from list
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ── Share Modal ────────────────────────────────────────────
function ShareModal({list,url,copied,onCopy,onToggle,onClose}:{list:Wishlist;url:string;copied:boolean;onCopy:()=>void;onToggle:()=>void;onClose:()=>void}) {
  const lt = LIST_TYPES[list.list_type];
  return (
    <Sheet onClose={onClose} title="Share This List">
      <div style={{padding:'16px',background:C.warm,borderRadius:6,marginBottom:20,display:'flex',gap:14,alignItems:'flex-start'}}>
        <div style={{color:lt.color,marginTop:2}}>{lt.icon}</div>
        <div>
          <div style={{fontFamily:C.serif,fontSize:16,fontWeight:400,letterSpacing:'0.01em',marginBottom:2}}>{list.name}</div>
          <div style={{fontSize:12,color:C.inkLight,fontWeight:300}}>{lt.label}</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:list.is_public?C.success:C.inkLight,fontWeight:500}}>
            {list.is_public?'Public':'Private'}
          </span>
          <button onClick={onToggle}
            style={{padding:'7px 14px',borderRadius:4,border:`1px solid ${C.border}`,background:C.surface,color:C.inkMid,fontFamily:C.sans,fontSize:12,fontWeight:500,cursor:'pointer'}}>
            {list.is_public?'Make Private':'Make Public'}
          </button>
        </div>
      </div>

      {list.is_public ? (
        <>
          <FL>Share Link</FL>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <input readOnly value={url} style={{flex:1,padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:4,fontSize:12,color:C.inkMid,background:C.bg,fontFamily:C.mono}}/>
            <button onClick={onCopy}
              style={{padding:'10px 16px',borderRadius:4,border:'none',background:copied?C.success:C.ink,color:'white',fontFamily:C.sans,fontSize:12,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',transition:'background 0.2s',display:'flex',alignItems:'center',gap:6}}>
              {copied?Icon.check:Icon.copy} {copied?'Copied':'Copy'}
            </button>
          </div>
          <p style={{fontSize:12,color:C.inkLight,lineHeight:1.6,fontWeight:300,margin:0}}>
            Anyone with this link can view your list and mark items as purchased — no account needed. Perfect for family gift coordination.
          </p>
        </>
      ) : (
        <p style={{fontSize:13,color:C.inkMid,lineHeight:1.6,fontWeight:300,margin:0}}>
          Make this list public to generate a shareable link. Family and friends can see items and claim gifts without needing a Clarityboards account.
        </p>
      )}

      <div style={{marginTop:20}}>
        <FBtnPrimary onClick={onClose}>Done</FBtnPrimary>
      </div>
    </Sheet>
  );
}

// ── Design primitives ──────────────────────────────────────
function Sheet({children,onClose,title,wide=false}:{children:React.ReactNode;onClose:()=>void;title:string;wide?:boolean}) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(26,23,20,0.5)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:C.surface,width:'100%',maxWidth:wide?620:520,borderRadius:'12px 12px 0 0',padding:'8px 28px 48px',maxHeight:'92dvh',overflowY:'auto',boxShadow:'0 -4px 40px rgba(26,23,20,0.12)'}}>
        <div style={{width:32,height:3,borderRadius:2,background:C.border,margin:'12px auto 24px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{fontFamily:C.serif,fontSize:22,fontWeight:400,letterSpacing:'0.01em'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.inkLight,padding:4}}>{Icon.x}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FL({children}:{children:React.ReactNode}) {
  return <div style={{fontSize:10,fontWeight:500,color:C.inkLight,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,fontFamily:C.sans}}>{children as any}</div>;
}
function FInput({value,onChange,onBlur,placeholder,type,noMargin}:{value:string;onChange:(e:any)=>void;onBlur?:(e:any)=>void;placeholder?:string;type?:string;noMargin?:boolean}) {
  return <input value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} type={type||'text'}
    style={{width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:4,fontSize:13,fontFamily:C.sans,color:C.ink,background:C.bg,marginBottom:noMargin?0:16,fontWeight:300,outline:'none',transition:'border-color 0.15s'}}/>;
}
function FBtnPrimary({children,onClick,disabled}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean}) {
  return <button onClick={onClick} disabled={disabled}
    style={{flex:2,width:'100%',padding:'12px',borderRadius:4,border:'none',background:disabled?'#CCCAC7':C.ink,color:disabled?'#8A8884':'white',fontFamily:C.sans,fontWeight:500,fontSize:13,cursor:disabled?'not-allowed':'pointer',letterSpacing:'0.02em',transition:'background 0.15s'}}>
    {children}
  </button>;
}
function FBtnGhost({children,onClick}:{children:React.ReactNode;onClick:()=>void}) {
  return <button onClick={onClick}
    style={{flex:1,padding:'12px',borderRadius:4,border:`1px solid ${C.border}`,background:'transparent',color:C.inkMid,fontFamily:C.sans,fontWeight:500,fontSize:13,cursor:'pointer',letterSpacing:'0.02em'}}>
    {children}
  </button>;
}

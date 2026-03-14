"use client";
/**
 * Clarityboards — WishlistBoard
 * File: app/settings/wishlist/page.tsx
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
type ListType  = 'birthday'|'christmas'|'registry'|'grocery'|'home'|'general';
type Priority  = 'high'|'medium'|'low';
type ItemStatus = 'want'|'purchased'|'received';

const T = {
  cream:'#FAF9F7', ivory:'#FFFEF9', sand:'#F2EDE6',
  border:'#EDE9E3', muted:'#C8B8A8', sub:'#9C8B7A',
  ink:'#2C2318', purple:'#9B6B9E', purpleLight:'#F5EDF6',
  serif:"'Cormorant Garamond',Georgia,serif",
  sans:"'DM Sans',system-ui,sans-serif",
};

const LIST_TYPES: Record<ListType,{emoji:string;label:string;color:string}> = {
  birthday:  {emoji:'🎂',label:'Birthday',    color:'#C17A5A'},
  christmas: {emoji:'🎄',label:'Christmas',   color:'#2C6E8A'},
  registry:  {emoji:'💍',label:'Registry',    color:'#9B6B9E'},
  grocery:   {emoji:'🛒',label:'Grocery',     color:'#5C8B6A'},
  home:      {emoji:'🏠',label:'Home',        color:'#8B6B3C'},
  general:   {emoji:'✦', label:'General',     color:'#6B6B8A'},
};
const PRIORITY_STYLES: Record<Priority,{emoji:string;label:string;bg:string;text:string}> = {
  high:   {emoji:'🔴',label:'High',  bg:'#FADBD8',text:'#8B2020'},
  medium: {emoji:'🟡',label:'Medium',bg:'#FEF3CD',text:'#8B6914'},
  low:    {emoji:'🟢',label:'Low',   bg:'#D5F0E0',text:'#1E6B40'},
};
const STATUS_STYLES: Record<ItemStatus,{label:string;bg:string;text:string}> = {
  want:      {label:'Want it',   bg:'#F5EDF6',text:'#9B6B9E'},
  purchased: {label:'Purchased', bg:'#D5F0E0',text:'#1E6B40'},
  received:  {label:'Received ✓',bg:'#EAEDED',text:'#717D7E'},
};

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
  const [copiedToken, setCopiedToken]   = useState(false);

  useEffect(() => { loadLists(); }, []);

  const hdrs = async () => {
    const { data:{session} } = await supabase.auth.getSession();
    return { Authorization:`Bearer ${session?.access_token??''}`, 'Content-Type':'application/json' };
  };
  const api = async (method:string, path:string, body?:object) => {
    const h = await hdrs();
    return fetch(path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  };

  const loadLists = async () => {
    const { data:{user} } = await supabase.auth.getUser();
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
    if (d.list) {
      setLists(prev=>prev.map(l=>l.id===list.id?d.list:l));
      setShareModal(d.list);
    }
  };

  const shareUrl = (list:Wishlist) =>
    typeof window!=='undefined' ? `${window.location.origin}/share/wishlist/${list.share_token}` : '';

  const copyShareUrl = (list:Wishlist) => {
    navigator.clipboard.writeText(shareUrl(list));
    setCopiedToken(true);
    setTimeout(()=>setCopiedToken(false), 2000);
  };

  // Group items by status for display
  const wantItems      = items.filter(i=>i.status==='want');
  const purchasedItems = items.filter(i=>i.status!=='want');
  const lt = activeList ? LIST_TYPES[activeList.list_type] : null;

  return (
    <div style={{fontFamily:T.sans,minHeight:'100vh',background:T.cream}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        *{box-sizing:border-box;}
        .wcard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(44,35,24,0.12)!important;}
        .lcard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(44,35,24,0.12)!important;}
      `}</style>

      {/* Nav */}
      <nav style={{background:T.ink,padding:'0 20px',position:'sticky',top:0,zIndex:30}}>
        <div style={{maxWidth:960,margin:'0 auto',height:56,display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>{if(activeList){setActiveList(null);setItems([]);}else router.push('/dashboard');}}
            style={{color:'rgba(255,255,255,0.5)',background:'none',border:'none',cursor:'pointer',fontSize:13,fontFamily:T.sans}}>
            ← {activeList?'All Lists':'Dashboard'}
          </button>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.12)'}}/>
          <span style={{fontFamily:T.serif,color:'white',fontSize:19,fontWeight:500}}>
            {activeList ? `${lt?.emoji} ${activeList.name}` : '✦ WishlistBoard'}
          </span>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {activeList && (
              <button onClick={()=>setShareModal(activeList)}
                style={{padding:'6px 14px',borderRadius:20,border:'none',background:'rgba(255,255,255,0.12)',color:'white',fontWeight:600,fontSize:11,cursor:'pointer',fontFamily:T.sans}}>
                🔗 Share
              </button>
            )}
            <button onClick={()=>activeList?setShowAddItem(true):setShowAddList(true)}
              style={{padding:'6px 14px',borderRadius:20,border:'none',background:T.purple,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans}}>
              + {activeList?'Add Item':'New List'}
            </button>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:960,margin:'0 auto',padding:'28px 20px 100px'}}>

        {/* List view */}
        {!activeList && (
          <>
            {loading ? (
              <div style={{textAlign:'center',padding:'60px 0',fontFamily:T.serif,fontSize:22,color:T.sub,fontStyle:'italic'}}>Loading…</div>
            ) : lists.length===0 ? (
              <EmptyLists onAdd={()=>setShowAddList(true)}/>
            ) : (
              <>
                <div style={{fontFamily:T.serif,fontSize:32,color:T.ink,fontWeight:500,marginBottom:6}}>My Wish Lists</div>
                <div style={{fontSize:13,color:T.sub,fontStyle:'italic',marginBottom:28}}>{lists.length} {lists.length===1?'list':'lists'}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
                  {lists.map(list=><ListCard key={list.id} list={list} itemCount={0} onClick={()=>openList(list)} onShare={()=>setShareModal(list)}/>)}
                  <div onClick={()=>setShowAddList(true)}
                    style={{borderRadius:16,border:`2px dashed ${T.border}`,background:T.ivory,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:'40px 20px',minHeight:180,transition:'all 0.15s',color:T.muted}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.purple;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border;}}>
                    <div style={{fontSize:28}}>✦</div>
                    <div style={{fontFamily:T.serif,fontSize:16,fontStyle:'italic'}}>Create a new list</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Items view */}
        {activeList && (
          <>
            {/* List header */}
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:28,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:52,height:52,borderRadius:14,background:lt?.color??T.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>
                {lt?.emoji}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:T.serif,fontSize:26,color:T.ink,fontWeight:500}}>{activeList.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:T.purpleLight,color:T.purple}}>{lt?.label}</span>
                  <span style={{fontSize:12,color:T.sub}}>{items.length} {items.length===1?'item':'items'}</span>
                  {activeList.is_public && <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'#D5F0E0',color:'#1E6B40'}}>🔗 Shared</span>}
                </div>
              </div>
              <button onClick={()=>setShowAddItem(true)}
                style={{padding:'8px 16px',borderRadius:20,border:'none',background:T.purple,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans}}>
                + Add Item
              </button>
            </div>

            {/* Demo sites callout */}
            <div style={{background:`linear-gradient(135deg,${T.purpleLight},#EDE9F5)`,border:'1px solid #D9C8DC',borderRadius:14,padding:'14px 18px',marginBottom:24,display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:22}}>🛍️</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:T.serif,fontSize:15,color:T.ink,fontWeight:500}}>Paste any product URL</div>
                <div style={{fontSize:12,color:T.sub,marginTop:2}}>
                  Works with Loft, White House Black Market, Amazon, Etsy, Nordstrom, and any retailer. Photo, title, and price import automatically. Price watching starts immediately.
                </div>
              </div>
            </div>

            {/* Want items */}
            {wantItems.length===0 && items.length===0 ? (
              <EmptyItems listType={activeList.list_type} onAdd={()=>setShowAddItem(true)}/>
            ) : (
              <>
                {wantItems.length>0 && (
                  <>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>
                      {wantItems.length} {wantItems.length===1?'item':'items'}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:28}}>
                      {wantItems.map(item=><WishItemCard key={item.id} item={item} onClick={()=>setDetailItem(item)}/>)}
                    </div>
                  </>
                )}
                {purchasedItems.length>0 && (
                  <>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
                      Purchased / Received
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
                      {purchasedItems.map(item=><WishItemCard key={item.id} item={item} onClick={()=>setDetailItem(item)}/>)}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddList  && <AddListModal onSave={createList} onClose={()=>setShowAddList(false)}/>}
      {showAddItem  && activeList && <AddItemModal listId={activeList.id} onSave={addItem} onClose={()=>setShowAddItem(false)}/>}
      {detailItem   && <ItemDetailModal item={detailItem} onUpdate={u=>updateItem(detailItem.id,u)} onDelete={()=>deleteItem(detailItem.id)} onClose={()=>setDetailItem(null)}/>}
      {shareModal   && (
        <ShareModal
          list={shareModal}
          shareUrl={shareUrl(shareModal)}
          copied={copiedToken}
          onCopy={()=>copyShareUrl(shareModal)}
          onToggle={()=>toggleShare(shareModal)}
          onClose={()=>setShareModal(null)}/>
      )}
    </div>
  );
}

// ── List Card ──────────────────────────────────────────────
function ListCard({list,itemCount,onClick,onShare}:{list:Wishlist;itemCount:number;onClick:()=>void;onShare:()=>void}) {
  const lt = LIST_TYPES[list.list_type];
  return (
    <div className="lcard" onClick={onClick} style={{borderRadius:16,background:T.ivory,border:'1px solid #EDE9E3',overflow:'hidden',cursor:'pointer',boxShadow:'0 2px 8px rgba(44,35,24,0.06)',transition:'transform 0.2s,box-shadow 0.2s'}}>
      <div style={{height:8,background:lt.color}}/>
      <div style={{padding:'18px 18px 20px'}}>
        <div style={{fontSize:32,marginBottom:10}}>{lt.emoji}</div>
        <div style={{fontFamily:T.serif,fontSize:20,color:T.ink,fontWeight:500,marginBottom:4}}>{list.name}</div>
        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:T.purpleLight,color:T.purple}}>{lt.label}</span>
          {list.is_public && <span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:20,background:'#D5F0E0',color:'#1E6B40'}}>🔗 Shared</span>}
        </div>
        {list.description && <div style={{fontSize:11,color:T.sub,marginTop:8,fontStyle:'italic'}}>{list.description}</div>}
      </div>
    </div>
  );
}

// ── Wish Item Card ─────────────────────────────────────────
function WishItemCard({item,onClick}:{item:WishItem;onClick:()=>void}) {
  const s = STATUS_STYLES[item.status];
  const p = PRIORITY_STYLES[item.priority];
  const isDone = item.status!=='want';
  return (
    <div className="wcard" onClick={onClick} style={{borderRadius:12,background:T.ivory,border:'1px solid #EDE9E3',overflow:'hidden',cursor:'pointer',boxShadow:'0 1px 6px rgba(44,35,24,0.06)',transition:'transform 0.2s,box-shadow 0.2s',opacity:isDone?0.65:1}}>
      {item.cover_image ? (
        <div style={{height:140,overflow:'hidden',position:'relative'}}>
          <img src={item.cover_image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).parentElement!.style.display='none';}}/>
          {item.watch_id && <div style={{position:'absolute',top:7,right:7,background:'rgba(44,35,24,0.75)',borderRadius:20,padding:'2px 7px',fontSize:9,fontWeight:700,color:'white'}}>👁️ Watching</div>}
          {item.price && <div style={{position:'absolute',bottom:7,left:7,background:'rgba(255,255,255,0.92)',borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:700,color:T.ink}}>${item.price.toFixed(2)}</div>}
        </div>
      ) : (
        <div style={{height:4,background:T.purple}}/>
      )}
      <div style={{padding:'10px 12px 13px'}}>
        <div style={{fontSize:12,fontWeight:600,color:isDone?T.muted:T.ink,lineHeight:1.35,marginBottom:6,textDecoration:isDone?'line-through':'none'}}>{item.title}</div>
        <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:s.bg,color:s.text}}>{s.label}</span>
          <span style={{fontSize:9}}>{p.emoji}</span>
          {!item.cover_image && item.price && <span style={{fontSize:11,fontWeight:700,color:T.ink}}>${item.price.toFixed(2)}</span>}
        </div>
        {item.target_price && item.price && item.price>item.target_price && (
          <div style={{fontSize:10,color:'#5C8B6A',marginTop:5,fontStyle:'italic'}}>🎯 Target: ${item.target_price.toFixed(2)}</div>
        )}
      </div>
    </div>
  );
}

// ── Empty States ───────────────────────────────────────────
function EmptyLists({onAdd}:{onAdd:()=>void}) {
  return (
    <div style={{maxWidth:680,margin:'0 auto',textAlign:'center',padding:'48px 20px'}}>
      <div style={{fontSize:52,marginBottom:16}}>✦</div>
      <div style={{fontFamily:T.serif,fontSize:30,color:T.ink,fontWeight:500,marginBottom:8}}>Your wish lists</div>
      <div style={{fontSize:14,color:T.sub,fontStyle:'italic',lineHeight:1.8,marginBottom:32}}>
        Create lists for every occasion — birthday, Christmas,<br/>
        registry, home, or just things you love. Paste any product URL<br/>
        and the photo, price, and price watch set up automatically.
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10,marginBottom:32}}>
        {Object.entries(LIST_TYPES).map(([key,lt])=>(
          <div key={key} style={{background:'white',borderRadius:12,border:'1px solid #EDE9E3',padding:'16px 14px',textAlign:'left'}}>
            <div style={{fontSize:24,marginBottom:6}}>{lt.emoji}</div>
            <div style={{fontFamily:T.serif,fontSize:15,color:T.ink,fontWeight:500}}>{lt.label}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{key==='birthday'?'Share with family':key==='christmas'?'Track who bought what':key==='registry'?'Wedding, baby, graduation':key==='grocery'?'Save for later':key==='home'?'Furniture & decor':'Anything you want'}</div>
          </div>
        ))}
      </div>
      <button onClick={onAdd} style={{padding:'14px 28px',borderRadius:12,border:'none',background:T.ink,color:'white',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:T.sans}}>
        Create your first list
      </button>
    </div>
  );
}

function EmptyItems({listType,onAdd}:{listType:ListType;onAdd:()=>void}) {
  const lt = LIST_TYPES[listType];
  const examples: Record<ListType,string[]> = {
    birthday: ['Loft dress','WHBM blazer','Amazon Echo'],
    christmas: ['AirPods','Le Creuset pot','Candle set'],
    registry:  ['KitchenAid mixer','Pottery Barn throw','Cuisinart set'],
    grocery:   ['Organic olive oil','Truffle salt','Specialty cheese'],
    home:      ['CB2 lamp','Article sofa','West Elm rug'],
    general:   ['Anything you want','Any product URL','Price watched automatically'],
  };
  return (
    <div style={{textAlign:'center',padding:'48px 20px'}}>
      <div style={{fontSize:42,marginBottom:12}}>{lt.emoji}</div>
      <div style={{fontFamily:T.serif,fontSize:24,color:T.ink,fontWeight:500,marginBottom:6}}>Nothing here yet</div>
      <div style={{fontSize:13,color:T.sub,fontStyle:'italic',lineHeight:1.7,marginBottom:8}}>
        Paste any product URL and the photo, name and price<br/>import automatically — then price watching starts.
      </div>
      <div style={{fontSize:12,color:T.muted,marginBottom:24}}>
        Try: {examples[listType].join(' · ')}
      </div>
      <button onClick={onAdd} style={{padding:'12px 24px',borderRadius:12,border:'none',background:T.purple,color:'white',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:T.sans}}>
        + Add your first item
      </button>
    </div>
  );
}

// ── Add List Modal ─────────────────────────────────────────
function AddListModal({onSave,onClose}:{onSave:(d:Partial<Wishlist>)=>void;onClose:()=>void}) {
  const [name,setName]       = useState('');
  const [type,setType]       = useState<ListType>('birthday');
  const [desc,setDesc]       = useState('');
  return (
    <Modal onClose={onClose} title="Create a Wish List">
      <SLabel>List Type</SLabel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:18}}>
        {(Object.entries(LIST_TYPES) as [ListType,any][]).map(([key,lt])=>(
          <button key={key} onClick={()=>setType(key)}
            style={{padding:'10px 8px',borderRadius:10,border:`1.5px solid ${type===key?T.purple:T.border}`,background:type===key?T.purpleLight:'white',cursor:'pointer',textAlign:'center',fontFamily:T.sans,transition:'all 0.15s'}}>
            <div style={{fontSize:20,marginBottom:3}}>{lt.emoji}</div>
            <div style={{fontSize:11,fontWeight:700,color:type===key?T.purple:T.ink}}>{lt.label}</div>
          </button>
        ))}
      </div>
      <SLabel>List Name *</SLabel>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder={`e.g. Lauren's Birthday 2026`} style={SI}/>
      <SLabel>Description (optional)</SLabel>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="For family to reference…" style={SI}/>
      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button onClick={onClose} style={GBtn}>Cancel</button>
        <button onClick={()=>{if(!name.trim())return;onSave({name,list_type:type,description:desc||null,color:LIST_TYPES[type].color});}}
          disabled={!name.trim()}
          style={{...PBtn,flex:2,background:T.purple,opacity:!name.trim()?0.5:1,cursor:!name.trim()?'not-allowed':'pointer'}}>
          Create List
        </button>
      </div>
    </Modal>
  );
}

// ── Add Item Modal ─────────────────────────────────────────
function AddItemModal({listId,onSave,onClose}:{listId:string;onSave:(d:Partial<WishItem>)=>void;onClose:()=>void}) {
  const [url,setUrl]             = useState('');
  const [title,setTitle]         = useState('');
  const [price,setPrice]         = useState('');
  const [targetPrice,setTarget]  = useState('');
  const [priority,setPriority]   = useState<Priority>('medium');
  const [notes,setNotes]         = useState('');
  const [cover,setCover]         = useState('');
  const [fetching,setFetching]   = useState(false);
  const [fetchSt,setFetchSt]     = useState('');

  const fetchProduct = async (raw:string) => {
    if (!raw.trim()) return;
    setFetching(true); setFetchSt('Fetching product…');
    try {
      const r = await fetch('/api/wishlist?action=fetch-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:raw.trim()})});
      const d = await r.json();
      if (d.title&&!title) setTitle(d.title);
      if (d.image) { setCover(d.image); }
      if (d.price&&!price) setPrice(String(d.price));
      if (d.image||d.title) setFetchSt(`✓ ${d.title?'Title':''}${d.image?' · Image':''}${d.price?' · $'+d.price:''} imported`);
      else setFetchSt('Saved URL — no product data found');
    } catch { setFetchSt('Could not fetch'); }
    setFetching(false);
  };

  const DEMO_URLS = [
    {label:'Loft',url:'https://www.loft.com'},
    {label:'WHBM',url:'https://www.whbm.com'},
    {label:'Nordstrom',url:'https://www.nordstrom.com'},
    {label:'Etsy',url:'https://www.etsy.com'},
  ];

  return (
    <Modal onClose={onClose} title="Add to Wish List">
      <SLabel>Product URL</SLabel>
      <input value={url} onChange={e=>setUrl(e.target.value)} onBlur={e=>fetchProduct(e.target.value)}
        placeholder="Paste any product link — Loft, WHBM, Amazon, Etsy…" style={SI}/>
      {fetchSt && <div style={{fontSize:11,color:fetchSt.startsWith('✓')?'#5C8B6A':'#9C8B7A',marginBottom:10,fontStyle:'italic'}}>{fetchSt}</div>}

      {/* Demo quick links */}
      {!url && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Popular stores</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {DEMO_URLS.map(d=>(
              <a key={d.label} href={d.url} target="_blank" rel="noreferrer"
                style={{fontSize:11,padding:'4px 10px',borderRadius:20,border:'1px solid #EDE9E3',color:T.sub,textDecoration:'none',background:'white'}}>
                {d.label} ↗
              </a>
            ))}
          </div>
          <div style={{fontSize:11,color:T.muted,fontStyle:'italic',marginTop:8}}>Find a product, copy its URL, paste above — the photo and price import automatically.</div>
        </div>
      )}

      {cover && (
        <div style={{borderRadius:10,overflow:'hidden',marginBottom:14,height:140,position:'relative'}}>
          <img src={cover} alt="product" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).parentElement!.style.display='none';}}/>
          <div style={{position:'absolute',top:7,left:7,background:'rgba(255,255,255,0.9)',borderRadius:20,padding:'2px 8px',fontSize:9,fontWeight:700,color:T.sub}}>✓ Photo imported</div>
        </div>
      )}

      <SLabel>Item Name *</SLabel>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Product name" style={SI}/>

      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1}}>
          <SLabel>Current Price</SLabel>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:T.sub,fontSize:13}}>$</span>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="59.99" style={{...SI,paddingLeft:24,marginBottom:0}}/>
          </div>
        </div>
        <div style={{flex:1}}>
          <SLabel>Alert me when ≤</SLabel>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:T.sub,fontSize:13}}>$</span>
            <input type="number" value={targetPrice} onChange={e=>setTarget(e.target.value)} placeholder="44.99" style={{...SI,paddingLeft:24,marginBottom:0}}/>
          </div>
        </div>
      </div>
      <div style={{fontSize:11,color:T.sub,fontStyle:'italic',marginBottom:14,marginTop:4}}>
        👁️ Price watch activates automatically — you'll be notified when the price drops.
      </div>

      <SLabel>Priority</SLabel>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {(['high','medium','low'] as Priority[]).map(p=>(
          <button key={p} onClick={()=>setPriority(p)}
            style={{flex:1,padding:'7px',borderRadius:10,border:`1.5px solid ${priority===p?T.ink:T.border}`,background:priority===p?T.ink:'white',cursor:'pointer',fontFamily:T.sans,fontSize:12,fontWeight:600,color:priority===p?'white':T.sub}}>
            {PRIORITY_STYLES[p].emoji} {PRIORITY_STYLES[p].label}
          </button>
        ))}
      </div>

      <SLabel>Notes (optional)</SLabel>
      <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Size, color, variant…" style={SI}/>

      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button onClick={onClose} style={GBtn}>Cancel</button>
        <button onClick={()=>{if(!title.trim())return;onSave({title,url:url||null,cover_image:cover||null,price:price?parseFloat(price):null,target_price:targetPrice?parseFloat(targetPrice):null,priority,notes:notes||null,status:'want'});}}
          disabled={!title.trim()||fetching}
          style={{...PBtn,flex:2,background:T.purple,opacity:(!title.trim()||fetching)?0.5:1,cursor:(!title.trim()||fetching)?'not-allowed':'pointer'}}>
          {fetching?'Importing…':'Add to List'}
        </button>
      </div>
    </Modal>
  );
}

// ── Item Detail Modal ──────────────────────────────────────
function ItemDetailModal({item,onUpdate,onDelete,onClose}:{item:WishItem;onUpdate:(u:Partial<WishItem>)=>void;onDelete:()=>void;onClose:()=>void}) {
  const [confirmDel,setConfirmDel] = useState(false);
  const [purchasedBy,setPurchasedBy] = useState(item.purchased_by??'');
  const s = STATUS_STYLES[item.status];
  const p = PRIORITY_STYLES[item.priority];
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(44,35,24,0.55)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:T.ivory,width:'100%',maxWidth:520,borderRadius:'20px 20px 0 0',maxHeight:'92dvh',overflowY:'auto'}}>
        {item.cover_image ? (
          <div style={{height:200,position:'relative',borderRadius:'20px 20px 0 0',overflow:'hidden'}}>
            <img src={item.cover_image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(44,35,24,0.65))'}}/>
            <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.25)',backdropFilter:'blur(8px)',border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',color:'white',fontSize:16}}>×</button>
            <div style={{position:'absolute',bottom:16,left:20,right:60}}>
              <div style={{fontFamily:T.serif,fontSize:22,color:'white',fontWeight:600,lineHeight:1.25}}>{item.title}</div>
              {item.price && <div style={{fontSize:14,color:'rgba(255,255,255,0.9)',fontWeight:700,marginTop:3}}>${item.price.toFixed(2)}</div>}
            </div>
          </div>
        ) : null}
        <div style={{padding:'20px 22px 44px'}}>
          {!item.cover_image && (
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontFamily:T.serif,fontSize:22,color:T.ink,fontWeight:500}}>{item.title}</div>
                {item.price && <div style={{fontSize:18,fontWeight:700,color:T.ink,marginTop:2}}>${item.price.toFixed(2)}</div>}
              </div>
              <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:T.muted}}>×</button>
            </div>
          )}

          {/* Meta */}
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:18,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:s.bg,color:s.text}}>{s.label}</span>
            <span style={{fontSize:10}}>{p.emoji} {p.label} priority</span>
            {item.watch_id && <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:'#EAF4F8',color:'#2C6E8A'}}>👁️ Price watched</span>}
            {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{fontSize:12,color:T.purple,fontWeight:600,textDecoration:'none',marginLeft:'auto'}}>View product ↗</a>}
          </div>

          {/* Price info */}
          {(item.price||item.target_price) && (
            <div style={{background:T.sand,borderRadius:12,padding:'14px 16px',marginBottom:18}}>
              <div style={{display:'flex',gap:20}}>
                {item.price && <div><div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>Current Price</div><div style={{fontFamily:T.serif,fontSize:22,color:T.ink,fontWeight:500,marginTop:2}}>${item.price.toFixed(2)}</div></div>}
                {item.target_price && <div><div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>Alert When ≤</div><div style={{fontFamily:T.serif,fontSize:22,color:'#5C8B6A',fontWeight:500,marginTop:2}}>${item.target_price.toFixed(2)}</div></div>}
              </div>
              {item.price && item.target_price && item.price<=item.target_price && (
                <div style={{marginTop:8,fontSize:12,color:'#5C8B6A',fontWeight:700}}>🎉 Price is at or below your target!</div>
              )}
              <a href="/settings/watch" style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:10,fontSize:11,color:'#2C6E8A',fontWeight:700,textDecoration:'none'}}>
                👁️ Manage price watches →
              </a>
            </div>
          )}

          {/* Status */}
          <SLabel>Status</SLabel>
          <div style={{display:'flex',gap:6,marginBottom:18}}>
            {(['want','purchased','received'] as ItemStatus[]).map(st=>(
              <button key={st} onClick={()=>onUpdate({status:st})}
                style={{flex:1,padding:'8px',borderRadius:10,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:T.sans,background:item.status===st?T.ink:'#F2EDE6',color:item.status===st?'white':T.sub}}>
                {STATUS_STYLES[st].label}
              </button>
            ))}
          </div>

          {/* Purchased by — for shared lists */}
          {item.status==='purchased' && (
            <div style={{marginBottom:18}}>
              <SLabel>Purchased by</SLabel>
              <div style={{display:'flex',gap:8}}>
                <input value={purchasedBy} onChange={e=>setPurchasedBy(e.target.value)} placeholder="Your name (shows on shared list)" style={{...SI,marginBottom:0,flex:1}}/>
                <button onClick={()=>onUpdate({purchased_by:purchasedBy||null})} style={{padding:'10px 14px',borderRadius:10,border:'none',background:T.ink,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans}}>Save</button>
              </div>
            </div>
          )}

          {item.notes && <div style={{background:T.sand,borderRadius:10,padding:'10px 14px',marginBottom:18,fontSize:13,color:'#6B5A4A',lineHeight:1.6}}>{item.notes}</div>}

          {confirmDel ? (
            <div style={{background:'#FDF6F3',borderRadius:10,padding:14}}>
              <div style={{fontFamily:T.serif,fontSize:16,color:T.ink,marginBottom:10}}>Remove this item?</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setConfirmDel(false)} style={GBtn}>Cancel</button>
                <button onClick={onDelete} style={{...PBtn,background:'#C0392B',flex:1}}>Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setConfirmDel(true)} style={{width:'100%',padding:11,borderRadius:10,border:'1px solid #EDE9E3',background:'transparent',color:T.muted,fontSize:13,cursor:'pointer',fontFamily:T.sans}}>
              Remove from list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Share Modal ────────────────────────────────────────────
function ShareModal({list,shareUrl,copied,onCopy,onToggle,onClose}:{list:Wishlist;shareUrl:string;copied:boolean;onCopy:()=>void;onToggle:()=>void;onClose:()=>void}) {
  const lt = LIST_TYPES[list.list_type];
  return (
    <Modal onClose={onClose} title={`Share ${lt.emoji} ${list.name}`}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'14px 16px',background:T.sand,borderRadius:12}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:T.serif,fontSize:15,color:T.ink,fontWeight:500}}>Public sharing</div>
            <div style={{fontSize:12,color:T.sub,marginTop:2}}>{list.is_public?'Anyone with the link can view this list':'Only you can see this list'}</div>
          </div>
          <button onClick={onToggle}
            style={{padding:'8px 18px',borderRadius:20,border:'none',background:list.is_public?'#C0392B':T.purple,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans}}>
            {list.is_public?'Make Private':'Make Public'}
          </button>
        </div>

        {list.is_public && (
          <>
            <SLabel>Share Link</SLabel>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input readOnly value={shareUrl} style={{...SI,marginBottom:0,flex:1,fontSize:11,color:T.sub}}/>
              <button onClick={onCopy}
                style={{padding:'10px 16px',borderRadius:10,border:'none',background:copied?'#5C8B6A':T.ink,color:'white',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.sans,whiteSpace:'nowrap'}}>
                {copied?'✓ Copied!':'Copy Link'}
              </button>
            </div>
            <div style={{fontSize:11,color:T.sub,fontStyle:'italic',lineHeight:1.6}}>
              Family and friends can view this list and mark items as purchased — so you don't get duplicates. They don't need a Clarityboards account.
            </div>
          </>
        )}
      </div>
      <button onClick={onClose} style={{...PBtn,background:T.ink}}>Done</button>
    </Modal>
  );
}

// ── Shared Components ──────────────────────────────────────
function Modal({children,onClose,title}:{children:React.ReactNode;onClose:()=>void;title:string}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(44,35,24,0.55)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:T.ivory,width:'100%',maxWidth:520,borderRadius:'20px 20px 0 0',padding:'10px 24px 44px',maxHeight:'92dvh',overflowY:'auto'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:T.serif,fontSize:22,color:T.ink,fontWeight:500}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:T.muted}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
const SI: React.CSSProperties = {width:'100%',padding:'10px 13px',borderRadius:10,border:'1px solid #EDE9E3',fontSize:13,fontFamily:"'DM Sans',system-ui",color:'#2C2318',marginBottom:12,outline:'none',background:'#FFFEF9'};
const PBtn: React.CSSProperties = {width:'100%',padding:'13px',borderRadius:12,border:'none',background:'#2C2318',color:'white',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:"'DM Sans',system-ui"};
const GBtn: React.CSSProperties = {flex:1,padding:'12px',borderRadius:12,border:'1px solid #EDE9E3',background:'transparent',color:'#9C8B7A',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',system-ui"};
function SLabel({children}:{children:React.ReactNode}) {
  return <div style={{fontSize:10,fontWeight:700,color:'#C8B8A8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7,fontFamily:"'DM Sans',system-ui"}}>{children as any}</div>;
}

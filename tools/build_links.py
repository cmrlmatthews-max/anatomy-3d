#!/usr/bin/env python3
"""Build data/links.json for Anatomy 3D.

For each study card this finds the other structures that the card text names (artery, nerve, attachments, branches...),
so the app can show them as tappable links. It also gives each card a "family" (the group that opens together in the
part explode). Run from the repository root:  python3 tools/build_links.py
"""
import json, re, sys, collections, unicodedata

root = sys.argv[1] if len(sys.argv) > 1 else '.'
cards = json.load(open(f'{root}/data/cards.json'))['cards']
parts = json.load(open(f'{root}/data/parts.json'))['parts']
labels = collections.defaultdict(set)
for p in parts:
    labels[p['card']].add(re.sub(r'\.(r|l|g)$', '', p.get('label') or p['mesh'], flags=re.I))

STOP = {'the', 'a', 'an'}
KEEP_S = ('ss', 'us', 'is', 'os', 'as')
TYPE_WORDS = {'bone', 'muscle', 'nerve', 'artery', 'vein', 'ligament', 'gland'}
BAD_ALIAS = {'body', 'head', 'neck', 'base', 'apex', 'root', 'arch', 'trunk', 'part', 'branch', 'tendon', 'capsule', 'disc', 'lobe', 'segment',
             'superior', 'inferior', 'anterior', 'posterior', 'medial', 'lateral', 'left', 'right', 'deep', 'superficial', 'joint', 'plexus',
             'vestibule', 'cortex', 'septum', 'wall', 'canal', 'sulcus', 'fold', 'pelvi', 'face', 'back', 'hand', 'foot', 'eye', 'nose', 'lip', 'skin'}

def toks(s):
    s = unicodedata.normalize('NFD', str(s).lower())
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    out = []
    for t in s.split():
        if t in STOP: continue
        if len(t) > 3 and t.endswith('s') and not t.endswith(KEEP_S): t = t[:-1]
        out.append(t)
    return out

# alias phrase (token tuple) -> set of card keys
alias = collections.defaultdict(set)
loose = collections.defaultdict(set)   # name with its type word removed ("Trapezius muscle" -> "trapezius"): must match a whole phrase
def add(k, text, table=None):
    t = tuple(toks(text))
    if not t: return
    if len(t) == 1 and (len(t[0]) < 5 or t[0] in BAD_ALIAS or t[0] in TYPE_WORDS): return
    (alias if table is None else table)[t].add(k)
for k, c in cards.items():
    names = {c['name'], re.sub(r'\([^)]*\)', ' ', c['name'])} | labels[k] | {re.sub(r'\([^)]*\)', ' ', l) for l in labels[k]}
    for n in names:
        add(k, n)
        t = toks(n)
        if len(t) > 1 and t[-1] in TYPE_WORDS: add(k, ' '.join(t[:-1]), loose)
        if len(t) > 1 and t[0] in TYPE_WORDS: add(k, ' '.join(t[1:]), loose)
MAXLEN = max(len(a) for a in alias)

LEAD = {'all', 'both', 'some', 'most', 'left', 'right', 'by', 'to', 'from', 'via', 'through', 'with', 'part', 'of'}
def find(text, types, me):
    """Card keys named in the text, longest phrase first, limited to the given types."""
    ok = lambda ks: sorted(k for k in ks if k != me and (types is None or cards[k]['type'] in types))
    out = []
    for seg in re.split(r'[,;:()\[\]/\u2192]| and | or | then ', str(text)):
        t = toks(seg)
        if not t: continue
        u = list(t)
        while u and u[0] in LEAD: u = u[1:]
        whole = ok(loose.get(tuple(u), ())) or ok(loose.get(tuple(t), ()))
        got, i = [], 0
        while i < len(t):
            hit = None
            for n in range(min(MAXLEN, len(t) - i), 0, -1):
                ks = ok(alias.get(tuple(t[i:i + n]), ()))
                if ks: hit = (n, ks); break
            if hit: got += hit[1]; i += hit[0]
            else: i += 1
        out += got or whole
    return out

B, C, L, M, N, CN, A, V, O = 'bone', 'cartilage', 'ligament', 'muscle', 'nerve', 'cns', 'artery', 'vein', 'organ'
# field -> (label on the card, target types)
RULES = {
    'parent': ('Part of', 'same'),
    'origin': ('Origin', {B, C, L}), 'insertion': ('Insertion', {B, C, L}),
    'nerve': ('Nerve supply', {N}), 'blood': ('Blood supply', {A, V}),
    'articulations': ('Articulates with', {B, C}), 'attachments': ('Attached structures', {M, L, B, C}),
    'joint': ('Joint', {B, C, L}), 'bones': ('Bones', {B, C}),
    'from': ('Arises from', {N, CN, A}), 'branches': ('Branches', {N, A}), 'supplies': ('Supplies', {M, O, B, CN}),
    'motor': ('Muscles supplied', {M}), 'into': ('Drains into', {V, O}), 'drains': ('Drains', {V, O}),
    'parts': ('Parts', 'same'), 'connections': ('Connections', {CN, N}),
}
ORDER = list(RULES)
links = {k: collections.OrderedDict() for k in cards}
def put(k, label, tos):
    cur = links[k].setdefault(label, [])
    for t in tos:
        if t != k and t not in cur: cur.append(t)
for k, c in cards.items():
    for f in ORDER:
        v = c.get(f)
        if v is None or isinstance(v, bool): continue
        label, types = RULES[f]
        if types == 'same': types = {B, C} if c['type'] in (B, C) else {c['type']}
        if f in ('branches', 'from') and c['type'] in (A, V): types = {c['type']}
        if f in ('branches', 'from') and c['type'] in (N, CN): types = {N, CN}
        for item in (v if isinstance(v, list) else [v]):
            put(k, label, find(item, types, k))
# reverse links: what attaches to a bone, what a nerve supplies, what a structure contains
for k, c in list(cards.items()):
    if c['type'] == M:
        for f, lab in (('origin', 'Muscles that start here'), ('insertion', 'Muscles that end here')):
            for t in links[k].get(RULES[f][0], []):
                if cards[t]['type'] in (B, C): put(t, lab, [k])
        for t in links[k].get('Nerve supply', []): put(t, 'Muscles supplied', [k])
    for t in links[k].get('Part of', []): put(t, 'Parts', [k])
for k, d in links.items():   # one place per target: the specific label wins over the general one
    for gen, spec in (('Part of', ('Arises from', 'Drains into')), ('Parts', ('Branches', 'Drains'))):
        if gen in d: d[gen] = [t for t in d[gen] if not any(t in d.get(s, []) for s in spec)]
CAP = 14
out_links = {}
for k, d in links.items():
    rows = [[lab, tos[:CAP]] for lab, tos in d.items() if tos]
    if rows: out_links[k] = rows

# families: the group that opens together in the part explode
FAMILY = {}
for g in ('Heart chambers', 'Heart valves', 'Papillary muscles', 'Cardiac veins', 'Coronary arteries', 'Aortic valve', 'Pulmonary valve', 'Heart'):
    FAMILY[g] = 'Heart'
for g in ('Lung lobes', 'Lobar and main bronchi', 'Segmental bronchi', 'Airway'):
    FAMILY[g] = 'Lungs and airway'
for g in ('Large intestine', 'Small intestine', 'Digestive canal', 'Taeniae coli'):
    FAMILY[g] = 'Digestive canal'
fam = {}
for k, c in cards.items():
    g = c.get('group') or ''
    par = c.get('parent') or ''
    if g in FAMILY: f = FAMILY[g]
    elif re.search(r'\b(heart|cardiac|coronary|atrioventricular|semilunar|aortic valve|pulmonary valve)\b', (g + ' ' + par + ' ' + c['name']).lower()) and c['region'] == 'Thorax' and c['type'] in (O, A, V): f = 'Heart'
    else: f = g
    if f: fam[k] = f

json.dump({'version': 1, 'links': out_links, 'family': fam}, open(f'{root}/data/links.json', 'w'), separators=(',', ':'), ensure_ascii=False)
n = sum(len(t) for rows in out_links.values() for _, t in rows)
print('cards with links:', len(out_links), 'of', len(cards), '| links:', n, '| families:', len(set(fam.values())))

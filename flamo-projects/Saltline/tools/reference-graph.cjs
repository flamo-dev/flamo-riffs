// Retain top-level declarations through their lexical bindings, including registrations.
const acorn = require('acorn'),
  scope = require('eslint-scope');
module.exports = function referenceGraph(js, names, registrar) {
  const ast = acorn.parse(js, { ecmaVersion: 2022, ranges: true });
  const fn = ast.body[0].expression.callee,
    manager = scope.analyze(ast, {
      ecmaVersion: 2022,
      sourceType: 'script',
      optimistic: true,
      ignoreEval: true,
    });
  const outer = manager.acquire(fn),
    decls = [],
    extras = new Map();
  for (const node of fn.body.body) {
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations)
        if (d.id.type === 'Identifier') decls.push({ name: d.id.name, node: d, kind: node.kind });
    } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration')
      decls.push({ name: node.id.name, node });
    else if (node.type === 'ExpressionStatement') {
      const es =
        node.expression.type === 'SequenceExpression' ? node.expression.expressions : [node.expression];
      for (const e of es) {
        if (e.type !== 'AssignmentExpression') continue;
        let base = e.left;
        while (base.type === 'MemberExpression') base = base.object;
        if (base.type !== 'Identifier' || !outer.set.has(base.name)) continue;
        const a = extras.get(base.name) || [];
        a.push(e);
        extras.set(base.name, a);
      }
    }
  }
  const refs = manager.scopes
    .flatMap((s) => s.references)
    .filter((r) => r.resolved?.scope === outer)
    .sort((a, b) => a.identifier.start - b.identifier.start);
  const all = new Map(decls.map((d) => [d.name, d])),
    selected = new Map();
  function visitNode(node) {
    let lo = 0,
      hi = refs.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (refs[m].identifier.start < node.start) lo = m + 1;
      else hi = m;
    }
    for (let i = lo; i < refs.length && refs[i].identifier.start < node.end; i++)
      visit(refs[i].resolved.name);
  }
  function visit(name) {
    if (selected.has(name)) return;
    const d = all.get(name);
    if (!d) throw Error('No definition for ' + name);
    selected.set(name, d);
    visitNode(d.node);
    for (const n of extras.get(name) || []) visitNode(n);
  }
  const pieces = [];
  for (const node of fn.body.body) {
    if (!registrar || !['ForOfStatement', 'ExpressionStatement'].includes(node.type)) continue;
    if (
      !refs.some(
        (r) =>
          r.resolved.name === registrar && r.identifier.start >= node.start && r.identifier.start < node.end,
      )
    )
      continue;
    visitNode(node);
    pieces.push([node.start, js.slice(node.start, node.end)]);
  }
  Object.values(names).forEach(visit);
  if (selected.has('gf') || selected.has('Hg') || selected.has('lt'))
    throw Error('Unexpected renderer dependency in CPU graph');
  for (const d of selected.values()) {
    pieces.push([d.node.start, (d.kind ? d.kind + ' ' : '') + js.slice(d.node.start, d.node.end) + ';']);
    for (const n of extras.get(d.name) || []) pieces.push([n.start, js.slice(n.start, n.end) + ';']);
  }
  pieces.sort((a, b) => a[0] - b[0]);
  return pieces;
};

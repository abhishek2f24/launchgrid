import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const out = new URL('.', import.meta.url).pathname
const header = { fill: '#1A1A18', font: { bold: true, color: '#FFFFFF' }, wrapText: true }
const title = { fill: '#EAF7F0', font: { bold: true, color: '#1A1A18', size: 16 } }
const col = (count) => String.fromCharCode(64 + count)

async function create(name, sheetName, columns, rows) {
  const wb = Workbook.create()
  const ws = wb.worksheets.add(sheetName)
  const last = col(columns.length)
  ws.showGridLines = false
  ws.getRange('A1:' + last + '1').merge()
  ws.getRange('A1').values = [[name.replace('.xlsx', '')]]
  ws.getRange('A1').format = title
  ws.getRange('A3:' + last + '3').values = [columns]
  ws.getRange('A3:' + last + '3').format = header
  ws.getRange('A4:' + last + (rows.length + 3)).values = rows
  ws.getRange('A3:' + last + (rows.length + 3)).format.wrapText = true
  ws.getRange('A3:' + last + (rows.length + 3)).format.borders = { preset: 'all', style: 'thin', color: '#E5E7EB' }
  ws.getRange('A1:' + last + (rows.length + 3)).format.autofitColumns()
  ws.getRange('A1:' + last + (rows.length + 3)).format.autofitRows()
  ws.freezePanes.freezeRows(3)
  const output = await SpreadsheetFile.exportXlsx(wb)
  await output.save(out + '/' + name)
  const check = await wb.inspect({ kind: 'table', range: 'A1:' + last + Math.min(rows.length + 3, 12), include: 'values', tableMaxRows: 12, tableMaxCols: columns.length })
  if (!check.ndjson) throw new Error('Verification failed for ' + name)
}

await create('ACCESS_CONTROL_MATRIX.xlsx', 'Access matrix',
  ['Persona','Plan','Route/resource','Action','Expected access','Actual access','Server enforcement','Frontend enforcement','Result','Severity','Evidence'],
  [
    ['Anonymous','Free','/research + public-search','Search published report','Published summary only','Published Mesh summary returned','is_public filter in server route','Preview CTA','Partial pass','P1','Live API + page'],
    ['User A','Free','product_ideas/{A UUID}','Read own private idea','Allow','1 row returned','RLS auth.uid()','N/A','Pass','P2','Direct REST token test'],
    ['User B','Free','product_ideas/{A UUID}','Read User A private idea','Deny/no metadata','0 rows returned','RLS auth.uid()','N/A','Pass','P2','Direct REST token test'],
    ['User B','Free','product_ideas/{A UUID}','Update User A private idea','Deny','0 rows updated','RLS auth.uid()','N/A','Pass','P2','Direct REST token test'],
    ['New user','Free','research_projects','Create first project','Allow after signup','Fresh profile + project created','Auth profile trigger','N/A','Pass','P2','Live DB/API retest'],
    ['Free user','Free','finalize_research_report','Third completed report','Deny after 2 completed reports','2 accepted; third rejected','Transactional RPC','No usage UI yet','Pass','P2','Concurrent live test'],
    ['Paid user','Pro','Billing checkout','Activate subscription','Allow after payment','Not implemented','No subscription webhook','Marketing only','Fail','P0','Webhook inspection'],
  ])

await create('PLAN_ENTITLEMENT_MATRIX.xlsx', 'Plan entitlements',
  ['Feature','Free','Pro','Business','Frontend gated','Backend gated','Usage tracked','Limit/reset','Bypass tested','Result'],
  [
    ['Completed research reports','2/month, finalized report only','25/month','250/month fair-use ceiling','Partial','Transactional finalization RPC','research_usage + completion ledger','Calendar month','3 concurrent calls capped at 2','Pass'],
    ['Private research ownership','Own only','Own only','Own/workspace intended','N/A','Yes for tested research tables','N/A','N/A','User B denied','Pass'],
    ['Store creation','1 expected','1 expected','Multiple expected','Partial','Tenant-scoped, not account-scoped','No','Undefined','Not fully testable','P1'],
    ['Custom domain','Not included','1 intended','5 intended','Copy/config only','No billing-backed enforcement','No','Undefined','Not tested','P1'],
    ['RFQ/sample/export/share/team','Not included','Advertised in brief','Advertised in brief','N/A','No durable model found','No','N/A','Not testable','Not implemented'],
    ['Paid activation','N/A','₹1,999/month','₹9,999/month','Pricing visible','No LaunchGrid subscription checkout','No','N/A','Webhook mismatch','P0'],
  ])

await create('ROUTE_NAVIGATION_AUDIT.xlsx', 'Route navigation',
  ['Route','Navigation label','Product area','Duplicate','Orphan','Broken','Old terminology','Authentication','Plan restriction','Owner scope','Recommended action'],
  [
    ['/','Homepage','Marketing','No','No','No','Store-builder legacy remains in footer/copy','Public','None','Public','Lead with research → validate → source → launch'],
    ['/research','Research','Public discovery','No','No','No','Workspace is misleading pre-login','Public','Preview only','Published reports only','Rename searched state to Search results'],
    ['/dashboard/research','Research','Private research','No','No','Signup path currently blocked by public.users FK','Project/idea/report terms blurred','Required','Quota partial','RLS user scoped','Add profile sync and usage counter'],
    ['/dashboard/products','Products','Store products','Potential overlap','No','Unknown','Ambiguous vs Product Idea','Required','Tenant plan','Tenant scoped','Rename Store products'],
    ['/dashboard','Dashboard','Store operation','Potential overlap','No','Unknown','Store-first legacy','Required','Tenant plan','Tenant scoped','Add research usage, blockers, drafts'],
    ['/pricing','Pricing','Billing','Duplicate prices in components','No','Unknown','Old plan names','Public','N/A','N/A','Read from shared plan config'],
  ])

await create('BUG_REGISTER.xlsx', 'Bug register',
  ['Bug ID','Severity','Persona','Plan','Route/feature','Steps','Expected','Actual','Data impact','Security impact','Revenue impact','Recommended fix','Owner','Status','Retest'],
  [
    ['LG-AUD-001','P0','New user','Free','Signup to research','Create auth account then create research project','Profile exists and project inserts','Remediated with auth profile trigger; live database test passed','Resolved','Resolved','Resolved','Keep browser signup regression coverage','Backend','Fixed locally','Signup + first project'],
    ['LG-AUD-002','P0','Free user','Free','Research quota','Run concurrent report finalization requests','At most remaining credits accepted','Remediated with completion ledger; 2 passed and third rejected','Resolved for tested race','Resolved for tested race','Resolved for tested race','Add failed-job/retry coverage','Backend','Fixed locally','Concurrent requests'],
    ['LG-AUD-003','P0','Paid user','Pro/Business','Billing','Complete LaunchGrid plan purchase','Plan activates and entitlements refresh','Webhook only handles merchant customer orders','No plan activation','Billing state mismatch','Cannot monetize safely','Dedicated billing order + signed webhook + account entitlement','Backend','Open','Success/fail/retry payment'],
    ['LG-AUD-004','P1','Store owner','Any','Research to draft','Promote non-launch-ready research','Block with reason','Server action does not require launch_ready','Unsafe draft conversion','Commercial risk','Lower launch quality','Server-side readiness/entitlement guard','Backend','Open','Rejected/blocked idea'],
    ['LG-AUD-005','P1','Anonymous','Free','Public search','Search a saved report','Result-first preview','Previously showed Not collected above match; locally corrected','Confusing conversion','None','Reduced conversion','Keep result-first regression test','Frontend','Fixed locally','Mesh query'],
    ['LG-AUD-006','P1','Business user','Business','Workspaces/team/share','Attempt collaboration/share/export','Role/scoped controls','No durable model/routes found','Feature absent','Unverified future exposure','Cannot sell Business promise','Implement before offering','Product/Backend','Open','Role/share tests'],
  ])

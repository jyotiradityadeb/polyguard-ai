import {describe,it,expect} from 'vitest';
import {candidate,node,source} from '../lib/importers/common';
import {parsePubChem} from '../lib/importers/pubchem';
import {parseChEMBL} from '../lib/importers/chembl';
import {recordSchema,reviewRecord,gradeFromDesign} from '../types/scientific';
const r=()=>candidate({id:'test-only',source:source('Literature','TEST-FIXTURE','https://example.org/test-fixture','unit test only',{},'Test fixture, not shipped scientific data'),subject:node('garlic','Garlic','herb'),predicate:'HERB_DRUG_INTERACTION',object:node('warfarin','Warfarin','drug'),summary:'Test fixture relationship',limitations:'Test fixture only',interaction:{herbId:'garlic',drugId:'warfarin',potentialConcern:'UNKNOWN',outcome:'UNCERTAIN',preparation:'Test fixture'}});
describe('scientific provenance',()=>{
 it('import defaults to pending, retains source and cannot auto-validate',()=>{const row=r();expect(row.status).toBe('REVIEW_PENDING');expect(row.source.sourceRecordId).toBe('TEST-FIXTURE');expect(row.evidenceGrade).toBe('U');expect(recordSchema.safeParse({...row,status:'VALIDATED'}).success).toBe(false);});
 it('demo cannot masquerade as validated',()=>expect(recordSchema.safeParse({...r(),status:'VALIDATED',source:{...r().source,sourceName:'PolyGuard demo'},review:{reviewedBy:'Tester',reviewedAt:new Date().toISOString(),notes:'Fixture review'}}).success).toBe(false));
 it('grade requires explicit design metadata',()=>{expect(gradeFromDesign('UNSPECIFIED')).toBe('U');expect(gradeFromDesign('IN_VITRO')).toBe('D');});
 it('PubChem identity does not create an interaction',()=>{const rows=parsePubChem({PropertyTable:{Properties:[{CID:1,Title:'Test compound'}]}});expect(rows[0].predicate).toBe('CHEMICAL_IDENTITY');expect(rows[0].interaction).toBeUndefined();});
 it('assay is tested-against, not clinical inhibition',()=>{const rows=parseChEMBL({activities:[{activity_id:1,molecule_chembl_id:'CHEMBL1',target_chembl_id:'CHEMBL2',target_pref_name:'Test target',assay_chembl_id:'CHEMBL3',standard_value:'2.5',standard_units:'nM'}]});expect(rows[0].predicate).toBe('PHYTOCHEMICAL_TESTED_AGAINST_TARGET');expect(rows[0].evidenceGrade).toBe('U');});
 it('permits explicit reviewer decisions and rejects stale writes',()=>{const row=r();const d={id:row.id,revision:0,status:'VALIDATED',reviewedBy:'Test reviewer',notes:'Test-only source checked explicitly.',sourceConfirmed:true,studyDesign:'CONTROLLED_HUMAN',outcome:'SIGNAL',potentialConcern:'UNKNOWN'};const next=reviewRecord(row,d);expect(next.status).toBe('VALIDATED');expect(next.evidenceGrade).toBe('A');expect(()=>reviewRecord(next,d)).toThrow('STALE_REVIEW');expect(reviewRecord(row,{...d,status:'REJECTED'}).status).toBe('REJECTED');});
});

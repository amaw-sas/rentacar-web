import * as v from 'valibot';

export function validateForm(schema: any, data: any){
    return v.parse(schema, data)
}
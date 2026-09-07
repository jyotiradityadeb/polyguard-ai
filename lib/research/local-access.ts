// Local hackathon interface, not authentication. Do not expose this server publicly.
export function localResearchRequest(request:Request){
 const host=new URL(request.url).hostname;
 if(!['127.0.0.1','localhost','[::1]'].includes(host))return false;
 const origin=request.headers.get('origin');
 return !origin||origin===new URL(request.url).origin;
}

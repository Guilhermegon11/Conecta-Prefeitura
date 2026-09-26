/** Test collection is enabled until explicitly disabled in the deployment. */
export function testMode(){return process.env.TEST_MODE?.trim().toLowerCase()!=='false';}

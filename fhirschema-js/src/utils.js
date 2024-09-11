const https = require("https");
const zlib = require("zlib");

const packageRegistryUrl =
  "https://storage.googleapis.com/fhir-schema-registry/1.0.0/";

function buildPackageFileUrl(packageCoordinate) {
  return `${packageRegistryUrl}${encodeURIComponent(packageCoordinate)}/package.ndjson.gz`;
}

async function getSpecificLineFromNdjson(url, targetLine) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          console.error(
            `Failed to fetch: ${response.statusCode} ${response.statusMessage}`,
          );
          return resolve(null);
        }

        const gunzip = zlib.createGunzip();
        const stream = response.pipe(gunzip);

        let currentLine = 0;
        let lineBuffer = "";

        stream.on("data", (chunk) => {
          lineBuffer += chunk.toString();

          while (lineBuffer.indexOf("\n") !== -1) {
            const newlineIndex = lineBuffer.indexOf("\n");
            const line = lineBuffer.slice(0, newlineIndex); // drop \n
            lineBuffer = lineBuffer.slice(newlineIndex + 1);
            currentLine++;

            if (currentLine === targetLine) {
              try {
                const parsedLine = JSON.parse(line);
                stream.destroy();
                return resolve(parsedLine);
              } catch (err) {
                return reject(
                  new Error("Failed to parse JSON: " + err.message),
                );
              }
            }
          }
        });

        stream.on("end", () => {
          if (currentLine < targetLine) {
            reject(`Finished preliminary, before target line#: ${targetLine}`);
          }
        });

        stream.on("error", (err) => {
          reject(err);
        });
      })
      .on("error", (err) => {
        console.error("Request error:", err.message);
        resolve(null);
      });
  });
}

async function getPackageMeta(packageCoordinate) {
  return await getSpecificLineFromNdjson(
    buildPackageFileUrl(packageCoordinate),
    1,
  );
}

async function getPackageDeps(packageCoordinate) {
  const packageMeta = await getPackageMeta(packageCoordinate);
  if (!packageMeta) {
    return [];
  }
  const packageDeps = normalizePackageDeps(packageMeta.dependencies);
  return packageDeps;
}

function normalizePackageDeps(packageDeps) {
  return packageDeps ? packageDeps.map((d) => d.slice(1)) : [];
}

function identity(x) {
  return x;
}

function difference(setA, setB) {
  return new Set([...setA].filter((x) => !setB.has(x)));
}

async function dependencyResolver(visitedDeps, enqueuedDeps) {
  if (enqueuedDeps.size === 0) {
    return Array.from(visitedDeps);
  } else {
    const promisifiedDeps = Array.from(enqueuedDeps).map(getPackageDeps);

    const resolvedPromises = await Promise.all(promisifiedDeps);

    const childDeps = new Set(resolvedPromises.flat().filter(identity));

    return await dependencyResolver(
      new Set([...visitedDeps, ...enqueuedDeps]),
      new Set(Array.from(difference(childDeps, new Set(visitedDeps)))),
    );
  }
}

async function obtainPackageDeps(packageCoordinate) {
  const rootDeps = await getPackageDeps(packageCoordinate);
  const fullDepsTree = await dependencyResolver(new Set(), new Set(rootDeps));
  return fullDepsTree;
}

(async () => {
  console.log(await obtainPackageDeps("hl7.fhir.us.core#5.0.0"));
  return;
})();

// resolve("hl7.fhir.us.core#5.0.0", 'https://hl7.fhir.us.core/StructureDefinition/us-core-patient')

// resolve("hl7.fhir.us.core#5.0.0", resolve-url("hl7.fhir.us.core#5.0.0", 'Period'))

// resolve(<url>, <package|package-coordinate>)

// validate("hl7.fhir.us.core#5.0.0", { meta: {profile: ['https://hl7.fhir.us.core/StructureDefinition/us-core-patient']}})

// resolve({dependencies: {}}, 'https://hl7.fhir.us.core/StructureDefinition/us-core-patient')

// // ctx — your root package with deps

// { meta: {profile: ['https://hl7.fhir.us.core/StructureDefinition/us-core-patient']}
//   resourceType: 'Patient' }

//     {deps: {hl7.fhir.r4.core 4.0.1
//             hl7.fhir.us.core 5.0.1}}

//   'Patient' -> 'https://hl7.fhir/StructureDefinition/Patient'

// resolve('https://hl7.fhir.us.core/StructureDefinition/us-core-patient')

// Patient -> 'https://hl7.fhir/StructureDefinition/Patient'
// 'https://hl7.fhir/StructureDefinition/Patient' -> 'https://hl7.fhir/StructureDefinition/Patient|4.0.1'
// 'https://hl7.fhir/StructureDefinition/Patient|4.0.1' -> {}

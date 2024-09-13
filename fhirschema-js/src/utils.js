import https from "https";
import zlib from "zlib";

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

async function resolveDeps(packageCoordinates) {
  const fullDepsTree = await dependencyResolver(
    new Set(),
    new Set(packageCoordinates),
  );
  return fullDepsTree;
}

export default { resolveDeps };

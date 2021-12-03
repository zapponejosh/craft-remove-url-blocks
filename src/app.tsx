import * as React from "react";
import * as ReactDOM from "react-dom";
import craftXIconSrc from "./craftx-icon.png";
import {
  AfterBlockLocation,
  CraftBlockUpdate,
  CraftUrlBlock,
} from "@craftdocs/craft-extension-api";

const App: React.FC<{}> = () => {
  const isDarkMode = useCraftDarkMode();

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <img className="icon" src={craftXIconSrc} alt="CraftX logo" />
      <button
        className={`btn ${isDarkMode ? "dark" : ""}`}
        onClick={replaceUrlBlock}
      >
        Change URL Block to Text Links
      </button>
    </div>
  );
};

function useCraftDarkMode() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    craft.env.setListener((env) => setIsDarkMode(env.colorScheme === "dark"));
  }, []);

  return isDarkMode;
}

async function replaceUrlBlock() {
  // const block = craft.blockFactory.textBlock({
  //   content: "Hello world!"
  // });

  // craft.dataApi.addBlocks([block]);
  // Query the page which is currently opened
  console.log("click");
  const result = await craft.dataApi.getCurrentPage();

  // Check for any error
  if (result.status !== "success") {
    throw new Error(result.message);
  }

  interface UrlBlockUpdate {
    url: string | undefined;
    text: string | undefined;
    afterLoc: AfterBlockLocation;
    oldId: string;
  }

  const pageBlock = result.data;
  const subBlocks = pageBlock.subblocks;
  const updates: UrlBlockUpdate[] = [];

  // Iterate on the sub blocks of the page
  subBlocks.forEach((element, i) => {
    if (element.type == "urlBlock") {
      // Get information to create new text block
      const url = element.url;
      const text = element.title || url;
      const blockId = element.id;

      const afterLoc = craft.location.afterBlockLocation(pageBlock.id, blockId);

      const newBlock = {
        url,
        text,
        afterLoc,
        oldId: blockId,
      };

      updates.push(newBlock);
    }
  });

  updates.forEach(async (updateBlock) => {
    // ensure data is valid - will just skip if missing for some reason
    if (updateBlock.text == undefined) return;
    if (updateBlock.url == undefined) return;

    // create text block
    const textBlock = craft.blockFactory.textBlock({
      content: [
        { text: updateBlock.text, link: { type: "url", url: updateBlock.url } },
      ],
    });

    // add block
    const newBlock = await craft.dataApi.addBlocks(
      [textBlock],
      updateBlock.afterLoc
    );

    // check for success
    if (newBlock.status !== "success") {
      throw new Error(newBlock.message);
    }

    // remove former url block
    const oldBlock = await craft.dataApi.deleteBlocks([updateBlock.oldId]);

    // check for success
    if (oldBlock.status !== "success") {
      throw new Error(oldBlock.message);
    }
  });
}

export function initApp() {
  ReactDOM.render(<App />, document.getElementById("react-root"));
}

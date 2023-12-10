import * as FileSystem from "expo-file-system";

export const deleteRecordingFromFileSystem = async (
  localUri: string
): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(localUri);
    return true;
  } catch {
    return false;
  }
};

export const moveRecordingToDocumentDir = async (
  cacheUri: string
): Promise<string> => {
  const filename = cacheUri.split("/").pop();
  const documentUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.moveAsync({ from: cacheUri, to: documentUri });

  return documentUri;
};

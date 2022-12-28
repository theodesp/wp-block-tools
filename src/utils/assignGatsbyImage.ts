import { IBlockBase } from '../types';

export const assignGatsbyImage = async ({
  blocks = [],
  graphql,
  coreImage,
  coreMediaText,
  coreCover,
}: {
  blocks: IBlockBase[];
  graphql: any;
  coreImage?: boolean;
  coreMediaText?: boolean;
  coreCover?: boolean;
}) => {
  const blocksCopy = [...blocks];
  const imagesToRetrieve: any[] = [];
  const addedImages: any = {};

  const retrieveGatsbyImage = (b: IBlockBase[]) => {
    for (let i = 0; i < b.length; i++) {
      const block = b[i];
      if (
        (coreImage && block.name === 'core/image') ||
        (coreCover && block.name === 'core/cover') ||
        (coreMediaText && block.name === 'core/media-text')
      ) {
        const id = block.attributes.id || block.attributes.mediaId;
        let width = block.attributes.width;
        if (block.name === 'core/media-text') {
          width = 1200 * ((block.attributes.mediaWidth || 50) / 100);
        }
        if (!!id && !addedImages[id]) {
          try {
            const query = graphql(`
            query ImageQuery${id} {
              wpMediaItem(databaseId: { eq: ${id} }) {
                databaseId
                gatsbyImage(width: ${Math.min(width, 1200)})
              }
            }
          `);
            imagesToRetrieve.push(query);
            addedImages[id] = true;
          } catch (e) {
            console.log('ERROR: ', e);
          }
        }
      }

      if (block.innerBlocks?.length) {
        retrieveGatsbyImage(block.innerBlocks);
      }
    }
  };

  retrieveGatsbyImage(blocksCopy);

  const images: any[] = await Promise.allSettled(imagesToRetrieve);

  const imagesMap: any = {};

  images
    .filter((image) => !!image.value.data?.wpMediaItem)
    .forEach((image) => {
      if (image.status === 'fulfilled') {
        const { databaseId, gatsbyImage } = image.value.data.wpMediaItem;

        imagesMap[databaseId] = {
          databaseId,
          gatsbyImage,
        };
      }
    });

  const setGatsbyImage = (b: IBlockBase[]) => {
    b.forEach((block) => {
      if (
        (coreImage && block.name === 'core/image') ||
        (coreCover && block.name === 'core/cover') ||
        (coreMediaText && block.name === 'core/media-text')
      ) {
        const id = block.attributes.id || block.attributes.mediaId;
        block.attributes.gatsbyImage = imagesMap[id]?.gatsbyImage;
      }
      if (block.innerBlocks?.length) {
        setGatsbyImage(block.innerBlocks);
      }
    });
  };

  setGatsbyImage(blocksCopy);

  return blocksCopy;
};

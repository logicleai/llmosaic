import { Model, ModelList, StandardModelList, EnrichedModelList, EnrichedModel} from "../types";

export function convertToStandardStaticModelList(enrichedModelList: EnrichedModelList): ModelList {
    // Map through the enriched models and extract only the properties defined in the Model interface
    const standardModels: Model[] = enrichedModelList.data.map(({ id, object, created, owned_by }) => {
        return { id, object, created, owned_by };
    });

    // Create the StandardModelList object
    const standardModelList: StandardModelList = {
        object: 'list',
        data: standardModels
    };

    return standardModelList;
}

function findEnrichment(modelId: string, modelEnrichmentData: EnrichedModel[]): EnrichedModel | null {
  const enrichment = modelEnrichmentData.find(enrichedModel => enrichedModel.id === modelId);

  if (!enrichment) {
    return null;
  }

  // Return a copy of the enrichment data without modifying the original
  return { ...enrichment };
}

export function enrichToStandardDynamicModelList(standardModelList: StandardModelList, modelEnrichmentData: EnrichedModel[]): EnrichedModelList {
  // Loop through the standardModelList and enrich each model
  const data = standardModelList.data.map(model => {
    const enrichment = findEnrichment(model.id, modelEnrichmentData);

    // If there is enrichment data, merge it with the model
    if (enrichment) {
      return { ...model, ...enrichment };
    }

    // If there isn't any enrichment data, fill the extra fields with null
    return {
      ...model,
      name: null,
      description: null,
      context_length: null,
      tokenizer: null,
      capabilities: null,
      prices: null
    };
  });

  // Create the EnrichedModelList object
  const enrichedModelList: EnrichedModelList = {
    object: 'list',
    data: data as EnrichedModel[] // casting to EnrichedModel[] as TypeScript cannot infer the enriched type automatically
  };

  return enrichedModelList;
}

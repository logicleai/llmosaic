import { Model, ModelList, StandardModelList, EnrichedModelList} from "../types";

export function convertToStandardModelList(enrichedModelList: EnrichedModelList): ModelList {
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
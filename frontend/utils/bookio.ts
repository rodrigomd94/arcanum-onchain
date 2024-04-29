
export const getBookPolicies = async () => {
    const response = await fetch(`api/getCollections`);
    const data = await response.json();
    return data;
}
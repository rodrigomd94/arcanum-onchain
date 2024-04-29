export const isScrollBottom = (e: any) => {
    return Math.ceil(e.target.scrollHeight - e.target.scrollTop) === e.target.clientHeight;
}
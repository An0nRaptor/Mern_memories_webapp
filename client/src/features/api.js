import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { signedOut } from "./authSlice.js";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.token;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
    }
});

// Normalise errors to { status, message } and drop an expired session.
async function baseQuery(args, api, extra) {
    const result = await rawBaseQuery(args, api, extra);
    if (result.error) {
        const { status, data } = result.error;
        if (status === 401 && api.getState().auth.token) api.dispatch(signedOut());
        const message =
            data?.error ||
            (status === "FETCH_ERROR" ? "Can't reach the server. Check your connection." : "Something went wrong. Please try again.");
        return { error: { status, message } };
    }
    return result;
}

// Apply the same change to every cached copy of a post (its detail page and
// any feed page it appears on). Returns the patches so callers can undo them.
function patchPost(dispatch, getState, id, change) {
    const patches = [];
    for (const { endpointName, originalArgs } of api.util.selectInvalidatedBy(getState(), [{ type: "Post", id }])) {
        if (endpointName === "getPost") {
            patches.push(dispatch(api.util.updateQueryData("getPost", originalArgs, p => change(p, true))));
        } else if (endpointName === "getPosts") {
            patches.push(
                dispatch(
                    api.util.updateQueryData("getPosts", originalArgs, draft => {
                        const p = draft.posts.find(x => x._id === id);
                        if (p) change(p, false);
                    })
                )
            );
        }
    }
    return patches;
}

export const api = createApi({
    reducerPath: "api",
    baseQuery,
    tagTypes: ["Post", "PostList", "Tags", "User"],
    endpoints: build => ({
        // ---- auth ----
        login: build.mutation({ query: body => ({ url: "/auth/login", method: "POST", body }) }),
        register: build.mutation({ query: body => ({ url: "/auth/register", method: "POST", body }) }),
        updateMe: build.mutation({
            query: body => ({ url: "/auth/me", method: "PATCH", body }),
            invalidatesTags: ["User"]
        }),

        // ---- posts ----
        getPosts: build.query({
            query: params => ({ url: "/posts", params }),
            providesTags: result => ["PostList", ...(result?.posts.map(p => ({ type: "Post", id: p._id })) ?? [])]
        }),
        getPost: build.query({
            query: id => `/posts/${id}`,
            providesTags: (_r, _e, id) => [{ type: "Post", id }]
        }),
        getRelated: build.query({ query: id => `/posts/${id}/related` }),
        createPost: build.mutation({
            query: body => ({ url: "/posts", method: "POST", body }),
            invalidatesTags: ["PostList", "Tags", "User"]
        }),
        updatePost: build.mutation({
            query: ({ id, ...body }) => ({ url: `/posts/${id}`, method: "PATCH", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Post", id }, "Tags"]
        }),
        deletePost: build.mutation({
            query: id => ({ url: `/posts/${id}`, method: "DELETE" }),
            invalidatesTags: ["PostList", "Tags", "User"]
        }),

        // Optimistic: the heart flips instantly everywhere, and rolls back
        // if the server rejects it.
        toggleLike: build.mutation({
            query: id => ({ url: `/posts/${id}/like`, method: "POST" }),
            async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
                const patches = patchPost(dispatch, getState, id, p => {
                    p.likedByMe = !p.likedByMe;
                    p.likeCount += p.likedByMe ? 1 : -1;
                });
                try {
                    await queryFulfilled;
                } catch {
                    patches.forEach(p => p.undo());
                }
            },
            invalidatesTags: ["User"]
        }),

        addComment: build.mutation({
            query: ({ id, text }) => ({ url: `/posts/${id}/comments`, method: "POST", body: { text } }),
            async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    patchPost(dispatch, getState, id, (p, isDetail) => {
                        if (isDetail) p.comments.push(data);
                        p.commentCount += 1;
                    });
                } catch {
                    /* the form shows the error */
                }
            },
            invalidatesTags: ["User"]
        }),
        deleteComment: build.mutation({
            query: ({ id, commentId }) => ({ url: `/posts/${id}/comments/${commentId}`, method: "DELETE" }),
            async onQueryStarted({ id, commentId }, { dispatch, getState, queryFulfilled }) {
                const patches = patchPost(dispatch, getState, id, (p, isDetail) => {
                    if (isDetail) p.comments = p.comments.filter(c => c._id !== commentId);
                    p.commentCount -= 1;
                });
                queryFulfilled.catch(() => patches.forEach(p => p.undo()));
            },
            invalidatesTags: ["User"]
        }),

        uploadPhoto: build.mutation({
            query: file => {
                const body = new FormData();
                body.append("photo", file);
                return { url: "/upload", method: "POST", body };
            }
        }),

        // ---- discovery ----
        getTags: build.query({ query: () => "/tags", providesTags: ["Tags"] }),
        getUser: build.query({ query: id => `/users/${id}`, providesTags: ["User"] })
    })
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useUpdateMeMutation,
    useGetPostsQuery,
    useGetPostQuery,
    useGetRelatedQuery,
    useCreatePostMutation,
    useUpdatePostMutation,
    useDeletePostMutation,
    useToggleLikeMutation,
    useAddCommentMutation,
    useDeleteCommentMutation,
    useUploadPhotoMutation,
    useGetTagsQuery,
    useGetUserQuery
} = api;

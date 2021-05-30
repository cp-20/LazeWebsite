#include "frame.h"
#include "wasm_frame.h"

const int F_wordSize = 4;
extern int funcs;

static F_access InFrame(int offset)
{
    F_access p = checked_malloc(sizeof(*p));
    p -> kind = inFrame;
    p -> u.offset = offset;
    return p;
}
static F_access InLocal(int index, Ty_ty type)
{
    F_access p = checked_malloc(sizeof(*p));
    p -> kind = inLocal;
    p -> u.index = index;
    p -> type = type;
    return p;
}
static F_access InGlobal(int index)
{
    F_access p = checked_malloc(sizeof(*p));
    p -> kind = inGlobal;
    p -> u.index = index;
    return p;
}
F_accessList boolToF_access(F_frame f, U_boolList boolList, Ty_tyList types)
{
    // f -> locals = 0;
    F_accessList list = checked_malloc(sizeof(*list));
    F_accessList retValue = list;
    list -> head =  NULL;
    list -> tail = NULL;
    if(boolList != NULL && types != NULL)
    {
        for(;boolList -> tail != NULL && types -> tail != NULL; types = types -> tail, boolList = boolList -> tail)
        {
            list -> head = F_allocLocal(f, boolList -> head, types -> head, FALSE);
            list -> tail = checked_malloc(sizeof(*list));
            list = list -> tail;
            list -> head = NULL;
            list -> tail = NULL;
        }
    }
    return retValue;
}
F_frame F_newFrame(Temp_label name, U_boolList list, Ty_tyList params)
{
    F_frame frame = checked_malloc(sizeof(*frame));
    frame -> name = name;
    frame -> locals = 0;
    frame -> offset = 0;
    frame -> localsTypeTemp = checked_malloc(sizeof(*(frame -> localsTypeTemp)));
    frame -> localsTypeTemp -> head = NULL;
    frame -> localsTypeTemp -> tail = NULL;
    frame -> localsType = frame -> localsTypeTemp;
    frame -> accessList = boolToF_access(frame, list, params);
    return frame;
}
Temp_label F_name(F_frame f)
{
    return f -> name;
}
F_accessList F_formals(F_frame f)
{
    return f -> accessList;
}
F_access F_allocLocal(F_frame f, bool escape, Ty_ty type, bool isLocal)
{
    F_access access;
    // printf("%s", S_name(f -> name));
    if(escape != 0)
    {
        access = InFrame(f -> offset);
        f -> offset += F_wordSize;
        printf("escaped\n");
    }
    else if(escape == FALSE)
    {
        access = InLocal(f -> locals, type);
        f -> locals+=1;
        if(!(f -> localsTypeTemp ))
            printf("debug\n");
        if(isLocal)
        {
            f -> localsTypeTemp -> head = access -> type;
            f -> localsTypeTemp -> tail = checked_malloc(sizeof(*(f -> localsTypeTemp)));
            f -> localsTypeTemp = f -> localsTypeTemp -> tail;
            f -> localsTypeTemp -> head = NULL;
            f -> localsTypeTemp -> tail = NULL;
        }
        printf("inLocal\n");
    }
    return access;
}